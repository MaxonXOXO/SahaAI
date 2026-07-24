import { supabase } from './supabaseClient';

export function safeParseJSON(str) {
    if (!str) return null;
    const clean = str.trim().replace(/```json|```/gi, '');
    try { return JSON.parse(clean); } catch (_) {
        const start = Math.min(...[clean.indexOf('{'), clean.indexOf('[')].filter((index) => index >= 0));
        const end = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
        if (Number.isFinite(start) && end > start) return JSON.parse(clean.slice(start, end + 1));
        throw new Error('The AI response was not valid JSON.');
    }
}

export function buildSystemPrompt(profile = {}) {
    const needs = Object.entries(profile.needs || {}).filter(([, active]) => active).map(([need]) => need);
    const modeRules = {
        dyslexia: 'Use short sentences, plain words, and easy-to-scan formatting.',
        adhd: 'Keep answers concise and use numbered steps for actions.',
        autism: 'Use clear, literal, predictable language. Avoid idioms.',
        dyscalculia: 'Explain quantities slowly with concrete examples.',
        lowVision: 'Use descriptive, concise language with clear headings.',
    };
    return `You are SahaAI, a friendly, patient accessibility assistant.
User name: ${profile.name || profile.username || 'User'}
Preferred language: ${profile.language === 'ml' ? 'Malayalam' : 'English'}
Accessibility needs: ${needs.join(', ') || 'none'}.
${modeRules[profile.primaryMode] || 'Be clear, encouraging, and direct.'}
Always be supportive, never condescending. Reply in Malayalam when the user writes in Malayalam; otherwise reply in English.`;
}

let currentProvider = 'gemini';
export function getAIProvider() { return currentProvider; }
export function setAIProvider(provider) {
    if (!['gemini', 'openai'].includes(provider)) throw new Error(`Unsupported AI provider: ${provider}`);
    currentProvider = provider;
}

async function callGateway(action, payload) {
    const { data, error } = await supabase.functions.invoke('api-gateway', { body: { action, payload } });
    if (error) throw new Error(error.message || 'Secure AI service is unavailable.');
    if (data?.error) throw new Error(data.error);
    return data;
}

function base64ToBytes(value) {
    const binary = atob(value || '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function toBase64(fileOrBlob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBlob);
    });
}

function pcmToWav(pcmData, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
    const blockAlign = numChannels * (bitsPerSample / 8);
    const buffer = new ArrayBuffer(44 + pcmData.length);
    const view = new DataView(buffer);
    const write = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
    write(0, 'RIFF'); view.setUint32(4, 36 + pcmData.length, true); write(8, 'WAVE');
    write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); view.setUint16(32, blockAlign, true); view.setUint16(34, bitsPerSample, true);
    write(36, 'data'); view.setUint32(40, pcmData.length, true); new Uint8Array(buffer, 44).set(pcmData);
    return new Blob([buffer], { type: 'audio/wav' });
}

export async function sendMessage(systemPrompt, messages, options = {}) {
    const data = await callGateway('chat', { provider: options.provider || currentProvider, systemPrompt, messages });
    if (!data?.text) throw new Error('No response from the AI service.');
    return data.text;
}

export async function getEmbedding(text) {
    if (!(text || '').trim()) return [];
    const data = await callGateway('embedding', { text });
    if (!Array.isArray(data?.values)) throw new Error('Invalid embedding response.');
    return data.values;
}

export async function generateSessionSummary(transcript, sessionTarget) {
    const prompt = `Summarize this speech therapy session in 2–3 factual, neutral sentences. Focus: ${sessionTarget}. Also flag self-harm, abuse, severe distress, or anything requiring adult attention. Return only JSON: {"summary":"...","flagged":true|false,"flag_reason":"..."|null}.\n\nTranscript:\n${transcript}`;
    return safeParseJSON(await sendMessage('You produce only safe, factual JSON.', [{ role: 'user', content: prompt }]));
}

export async function recognizeText(imageFileOrBlob, options = {}) {
    const image = await toBase64(imageFileOrBlob);
    const prompt = options.systemPrompt || 'Extract and return all readable text exactly as it appears. Output only the text. If none is visible, say "No text detected."';
    const data = await callGateway('ocr', { image, prompt });
    if (!data?.text) throw new Error('No OCR response from the AI service.');
    return data.text;
}

export async function generateGoogleSpeech(text, options = {}) {
    const data = await callGateway('speech', { provider: 'gemini', text, voice: options.voice || 'Puck' });
    const bytes = base64ToBytes(data?.audio);
    if (!bytes.length) throw new Error('No audio was returned.');
    return (data?.mimeType || '').toLowerCase().includes('wav') ? new Blob([bytes], { type: 'audio/wav' }) : pcmToWav(bytes);
}

export async function generateSpeech(text, options = {}) {
    const provider = options.provider || currentProvider;
    if (provider === 'gemini') return generateGoogleSpeech(text, options);
    const data = await callGateway('speech', { provider: 'openai', text, voice: options.voice || 'alloy' });
    const bytes = base64ToBytes(data?.audio);
    if (!bytes.length) throw new Error('No audio was returned.');
    return new Blob([bytes], { type: data?.mimeType || 'audio/mpeg' });
}

export async function generateStructuredJSON(prompt, schemaDescription) {
    const data = await callGateway('structured-json', { prompt, schemaDescription });
    return safeParseJSON(data?.text);
}

export async function generateAACTiles(context, profile) {
    const prompt = `Generate 8 to 12 relevant AAC communication tiles for: "${context}". Return only JSON: {"tiles":[{"labelEn":"simple English","labelMl":"Malayalam translation","iconName":"Lucide icon name"}]}.`;
    const system = `${buildSystemPrompt(profile)} You are an AAC specialist. Output only valid JSON.`;
    for (const provider of ['gemini', 'openai']) {
        try {
            const parsed = safeParseJSON(await sendMessage(system, [{ role: 'user', content: prompt }], { provider }));
            if (Array.isArray(parsed?.tiles)) return parsed.tiles;
        } catch (_) { /* try configured fallback */ }
    }
    throw new Error('Could not generate contextual AAC tiles.');
}

export async function generateLearnExplainer(profile, topic) {
    const prompt = `${buildSystemPrompt(profile)}\nCreate a concise explainer. Return only JSON: {"topic":"short title","explanation":"clear explanation","diagramSteps":["optional step"],"videoQuery":"YouTube search"}.\nTopic: ${topic}`;
    const parsed = safeParseJSON(await sendMessage(prompt, [{ role: 'user', content: topic }]));
    if (!parsed?.explanation) throw new Error('The explainer response was incomplete.');
    return { topic: parsed.topic?.trim() || topic, explanation: parsed.explanation.trim(), diagramSteps: Array.isArray(parsed.diagramSteps) ? parsed.diagramSteps.filter(Boolean).slice(0, 8) : [], videoQuery: parsed.videoQuery?.trim() || `${topic} explained` };
}

export async function generateLearnImage(topic) {
    const prompt = `A realistic, accessible educational illustration of ${topic}. Natural colors, clear subject, no text.`;
    try {
        const data = await callGateway('learn-image', { prompt });
        return data?.image ? `data:${data.mimeType || 'image/png'};base64,${data.image}` : null;
    } catch (error) { console.warn('generateLearnImage failed:', error.message); return null; }
}

export async function findLearnVideo(searchQuery, language = 'en') {
    try {
        const data = await callGateway('youtube-search', { query: searchQuery, language });
        return data?.item?.id?.videoId || null;
    } catch (_) { return null; }
}

export async function generateDailyLearnTopics(profile, eventTypes = []) {
    const prompt = `${buildSystemPrompt(profile)} Suggest 9 short, safe, useful learning topics for today based on accessibility needs and activity. Include at least 3 positive educational current-news ideas. Return only JSON: {"topics":[{"topic":"Title","summary":"Short summary"}]}. Recent activity: ${eventTypes.join(', ') || 'none'}.`;
    const parsed = safeParseJSON(await sendMessage(prompt, [{ role: 'user', content: 'Suggest today’s learning topics.' }]));
    return Array.isArray(parsed?.topics) ? parsed.topics.slice(0, 9) : [];
}
