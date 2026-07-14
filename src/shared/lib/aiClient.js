/**
 * aiClient.js — Gemini API wrapper for SahaAI.
 *
 * Builds a system prompt from the user's accessibility profile,
 * then sends the full conversation history to Gemini.
 */

/**
 * Build a system prompt that tells the AI who the user is.
 * @param {Object} profile — from useProfileStore
 */
export function buildSystemPrompt(profile) {
    const needsList = Object.entries(profile.needs || {})
        .filter(([, active]) => active)
        .map(([key]) => key);

    const needsStr = needsList.length > 0
        ? needsList.join(', ')
        : 'none specified';

    return `You are SahaAI, a friendly and patient accessibility assistant designed for people with learning differences and disabilities.

User profile:
- Name: ${profile.name || profile.username || 'User'}
- Role: ${profile.role || 'student'}
- Preferred language: ${profile.language === 'ml' ? 'Malayalam' : 'English'}
- Accessibility needs: ${needsStr}

Adapt your responses based on the user's needs:
${needsList.includes('dyslexia') ? '- DYSLEXIA: Use simple, short sentences. Avoid complex vocabulary. Use bullet points. Break text into small chunks.' : ''}
${needsList.includes('adhd') ? '- ADHD: Keep responses concise and focused. Use numbered steps. Highlight key points. Avoid long paragraphs.' : ''}
${needsList.includes('autism') ? '- AUTISM: Be literal and clear. Avoid sarcasm or idioms. Use structured, predictable response formats.' : ''}
${needsList.includes('dyscalculia') ? '- DYSCALCULIA: When explaining math, use visual descriptions and step-by-step breakdowns. Relate numbers to real-world objects.' : ''}
${needsList.includes('lowVision') ? '- LOW VISION: Use clear, descriptive language. When referencing visuals, describe them in detail.' : ''}

Always be encouraging, never condescending. If the user speaks in ${profile.language === 'ml' ? 'Malayalam' : 'English'}, respond in the same language.`.trim();
}

let currentProvider = 'gemini';

/**
 * Get the current active AI provider ('gemini' | 'openai')
 */
export function getAIProvider() {
    return currentProvider;
}

/**
 * Set the active AI provider ('gemini' | 'openai')
 */
export function setAIProvider(provider) {
    if (provider !== 'gemini' && provider !== 'openai') {
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
    currentProvider = provider;
}

/**
 * Send a conversation to the active provider and get the assistant reply.
 * @param {string} systemPrompt — built from buildSystemPrompt()
 * @param {Array<{role: string, content: string}>} messages — chat history (role: 'user' | 'assistant')
 * @param {Object} options — optional configurations (e.g. { provider: 'openai' })
 * @returns {Promise<string>} — assistant reply text
 */
export async function sendMessage(systemPrompt, messages, options = {}) {
    const provider = options.provider || currentProvider;

    if (provider === 'openai') {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('Missing VITE_OPENAI_API_KEY in .env');
        }

        console.log('[AI Client] Sending request to OpenAI with key prefix:', apiKey.slice(0, 8));

        const url = 'https://api.openai.com/v1/chat/completions';
        const chatMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({
                role: m.role,
                content: m.content
            }))
        ];

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: chatMessages
            })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`OpenAI API error ${res.status}: ${err}`);
        }

        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content;

        if (!reply) {
            throw new Error('No response from OpenAI');
        }

        return reply;
    }

    // Default to existing Gemini implementation
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing VITE_GEMINI_API_KEY in .env');
    }

    console.log('[AI Client] Sending request with key prefix:', apiKey.slice(0, 8), '... length:', apiKey.length);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

    // Map our roles to Gemini's format: 'assistant' → 'model'
    const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

    const body = {
        system_instruction: {
            parts: [{ text: systemPrompt }],
        },
        contents,
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
        throw new Error('No response from Gemini');
    }

    return reply;
}

/**
 * Helper to convert a File/Blob object to a Base64 Data URL.
 */
function toBase64(fileOrBlob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileOrBlob);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}

/**
 * Perform client-side OCR on an image file/blob using OpenAI Vision.
 * @param {Blob|File} imageFileOrBlob — The image file/blob
 * @param {Object} options — Optional configurations (provider, systemPrompt)
 * @returns {Promise<string>} — Extracted text
 */
export async function recognizeText(imageFileOrBlob, options = {}) {
    const provider = options.provider || currentProvider;
    if (provider !== 'openai') {
        throw new Error('OCR via recognizeText only supported via OpenAI provider currently');
    }

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing VITE_OPENAI_API_KEY in .env');
    }

    const base64DataUrl = await toBase64(imageFileOrBlob);

    const url = 'https://api.openai.com/v1/chat/completions';
    const systemPrompt = options.systemPrompt || 'You are an OCR assistant. Extract and return all readable text from the provided image. Output only the extracted text exactly as it appears. Do not include any explanations, greetings, markdown formatting blocks (like ```text), or metadata.';

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: systemPrompt
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: base64DataUrl
                            }
                        }
                    ]
                }
            ]
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI OCR error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
        throw new Error('No OCR response from OpenAI');
    }

    return reply;
}

/**
 * Convert text to speech using OpenAI's TTS endpoint.
 * @param {string} text — Text to convert
 * @param {Object} options — Optional configurations (voice, provider)
 * @returns {Promise<Blob>} — Audio binary data as a Blob
 */
export async function generateSpeech(text, options = {}) {
    const provider = options.provider || currentProvider;
    if (provider !== 'openai') {
        throw new Error('TTS only supported via OpenAI provider currently');
    }

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing VITE_OPENAI_API_KEY in .env');
    }

    const url = 'https://api.openai.com/v1/audio/speech';
    const voice = options.voice || 'alloy';

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: voice
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI TTS error ${res.status}: ${err}`);
    }

    return await res.blob();
}

