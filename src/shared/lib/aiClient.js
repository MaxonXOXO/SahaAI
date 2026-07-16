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

    const primaryMode = profile.primaryMode;
    const secondaryNeeds = needsList.filter((need) => need !== primaryMode);

    const bioSection = profile.bio ? `- Personal Bio / Context: ${profile.bio}` : '';

    let promptRules = '';

    // Primary Mode Adaptive Rules
    if (primaryMode) {
        promptRules += `PRIMARY MODE OPTIMIZATION (${primaryMode.toUpperCase()}): \n`;
        switch (primaryMode) {
            case 'dyslexia':
                promptRules += `* DYSLEXIA MODE (CRITICAL): Write in simple, short sentences. Avoid complex vocabulary. Use generous paragraph spacing, short lines, and clear bullet points. Keep text clean and easy to scan. Avoid large walls of text.\n`;
                break;
            case 'adhd':
                promptRules += `* ADHD MODE (CRITICAL): Keep responses brief and straight to the point. Break down multi-step tasks into clear, numbered checklists. Use bold text to highlight key action words. Keep paragraphs under 2-3 lines.\n`;
                break;
            case 'autism':
                promptRules += `* AUTISM MODE (CRITICAL): Use clear, literal, and highly predictable language. Absolutely avoid sarcasm, hyperbole, idioms, or metaphors. Keep the structure consistent and logical.\n`;
                break;
            case 'dyscalculia':
                promptRules += `* DYSCALCULIA MODE (CRITICAL): Avoid dense numbers, tables, or abstract math equations. Instead, explain math concepts visually, using real-world objects, clear analogies, and simple, conversational step-by-step logic.\n`;
                break;
            case 'lowVision':
                promptRules += `* LOW VISION MODE (CRITICAL): Use highly descriptive language. Structure your responses with clear, distinct headers so they are easy to navigate for screen readers. Keep the text concise.\n`;
                break;
            default:
                break;
        }
    }

    // Secondary Needs Adaptive Rules
    if (secondaryNeeds.length > 0) {
        promptRules += `\nSECONDARY ACCESSIBILITY CONTEXTS (Apply these guidelines supportively):\n`;
        secondaryNeeds.forEach((need) => {
            switch (need) {
                case 'dyslexia':
                    promptRules += `- Dyslexia: Keep sentences short, avoid complex terms.\n`;
                    break;
                case 'adhd':
                    promptRules += `- ADHD: Use structure, highlight key points.\n`;
                    break;
                case 'autism':
                    promptRules += `- Autism: Clear, literal tone, logical flow.\n`;
                    break;
                case 'dyscalculia':
                    promptRules += `- Dyscalculia: Explain numerical parts step-by-step with real-world analogies.\n`;
                    break;
                case 'lowVision':
                    promptRules += `- Low Vision: Structured headings, descriptive language.\n`;
                    break;
                default:
                    break;
            }
        });
    }

    return `You are SahaAI, a friendly, patient, and highly adaptive accessibility assistant designed for people with learning differences and disabilities.

User Profile:
- Name: ${profile.name || profile.username || 'User'}
- Preferred language: ${profile.language === 'ml' ? 'Malayalam' : 'English'}
- Primary Mode: ${primaryMode ? primaryMode.toUpperCase() : 'None Specified'}
- All Needs: ${needsList.length > 0 ? needsList.join(', ') : 'None'}
${bioSection}

Instruction: You MUST adapt your formatting, complexity, tone, and layout based on the rules below.

${promptRules || 'Respond in a friendly, clear, and encouraging manner.'}

General rules:
- Always be encouraging, supportive, and never condescending.
- If the user writes in Malayalam, respond in Malayalam. Otherwise, default to English.`.trim();
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
 * Build a WAV file container around raw PCM audio bytes.
 * Gemini TTS returns raw L16 (16-bit signed PCM) at 24 kHz mono.
 * Browsers require a WAV/RIFF header to decode it.
 *
 * @param {Uint8Array} pcmData — Raw 16-bit PCM bytes
 * @param {number} sampleRate — e.g. 24000
 * @param {number} numChannels — 1 (mono) or 2 (stereo)
 * @param {number} bitsPerSample — 16
 * @returns {Blob} — Playable audio/wav Blob
 */
function pcmToWav(pcmData, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
    const dataLength = pcmData.length;
    const blockAlign = numChannels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    const writeStr = (offset, str) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);   // file size - 8
    writeStr(8, 'WAVE');

    // fmt sub-chunk
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);               // sub-chunk size
    view.setUint16(20, 1, true);                // PCM = 1
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    writeStr(36, 'data');
    view.setUint32(40, dataLength, true);
    new Uint8Array(buffer, 44).set(pcmData);

    return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Convert text to speech using Google Gemini TTS (3.1 Flash series).
 * @param {string} text — Text to convert
 * @param {Object} options — Optional configurations (voice, model)
 * @returns {Promise<Blob>} — Playable audio/wav Blob
 */
export async function generateGoogleSpeech(text, options = {}) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing VITE_GEMINI_API_KEY in .env');
    }

    const modelName = options.model || 'gemini-3.1-flash-tts-preview';
    const voiceName = options.voice || 'Puck'; // Kore, Puck, Charon, Aoede, Fenrir

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const body = {
        contents: [
            {
                role: 'user',
                parts: [{ text }]
            }
        ],
        generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName }
                }
            }
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Google TTS error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!inlineData?.data) {
        throw new Error('No audio data returned from Gemini TTS');
    }

    // Decode base64 → raw bytes
    const binaryStr = atob(inlineData.data);
    const pcmBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        pcmBytes[i] = binaryStr.charCodeAt(i);
    }

    // Gemini TTS returns raw L16 PCM at 24 kHz mono.
    // Wrap it in a WAV container so the browser can play it.
    const mimeType = (inlineData.mimeType || '').toLowerCase();
    if (mimeType.includes('wav') || mimeType.includes('audio/wav')) {
        // Already a full WAV – return as-is
        return new Blob([pcmBytes], { type: 'audio/wav' });
    }

    // Raw PCM (audio/L16 or audio/pcm) → wrap in WAV
    return pcmToWav(pcmBytes, 24000, 1, 16);
}

/**
 * Convert text to speech using the selected AI provider.
 * @param {string} text — Text to convert
 * @param {Object} options — Optional configurations (voice, provider, model)
 * @returns {Promise<Blob>} — Audio binary data as a Blob
 */
export async function generateSpeech(text, options = {}) {
    const provider = options.provider || currentProvider;

    if (provider === 'gemini') {
        return generateGoogleSpeech(text, options);
    }

    if (provider !== 'openai') {
        throw new Error(`TTS unsupported for provider: ${provider}`);
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

/**
 * Send a prompt to OpenAI and guarantee a structured JSON response matching a described shape.
 *
 * @param {string} prompt - The user prompt detailing the task or context
 * @param {string} schemaDescription - Text description of the desired JSON structure
 * @returns {Promise<Object>} - Parsed JSON object
 */
export async function generateStructuredJSON(prompt, schemaDescription) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing VITE_OPENAI_API_KEY in .env');
    }

    const systemPrompt = `You are a helpful assistant that outputs structured data in JSON format.
You MUST respond ONLY with a valid JSON object matching the described shape.
Do NOT wrap the response in markdown code blocks (do not use \`\`\`json or \`\`\` code fences).
Do NOT include any commentary, greetings, explanation, or notes outside of the JSON object.

Required JSON Structure Description:
${schemaDescription}`;

    const url = 'https://api.openai.com/v1/chat/completions';
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' } // Force OpenAI JSON output mode
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI structured JSON error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    
    if (!content) {
        throw new Error('OpenAI returned an empty content body.');
    }

    try {
        const parsed = JSON.parse(content.trim());
        return parsed;
    } catch (err) {
        throw new Error(`Failed to parse OpenAI response as JSON. Content: "${content}". Error: ${err.message}`);
    }
}

/**
 * Generate a set of contextual AAC board tiles based on a given context.
 * Adapts to the user's accessibility profile.
 * Supporting both Gemini (default) and OpenAI (fallback) for JSON structure.
 *
 * @param {string} context - The situation (e.g. "Mealtime", "Going to the store")
 * @param {Object} profile - User profile with needs and bio
 * @returns {Promise<Array<Object>>} - Array of generated tiles
 */
export async function generateAACTiles(context, profile) {
    const userPrompt = `Generate a list of 8 to 12 highly relevant communication tiles for a non-verbal or overwhelmed user in this situation/context: "${context}".
Each tile represents a word, feeling, or simple action related to "${context}".
Provide the output as a JSON object with a single root key "tiles" containing an array of objects.
Each tile object MUST have exactly these fields:
- "labelEn": Simple English phrase or word (e.g., "Water", "More food", "Tired")
- "labelMl": Precise Malayalam translation/transliteration for the label (e.g., "വെള്ളം", "കൂടുതൽ ഭക്ഷണം")
- "iconName": Standard Lucide icon name matching the item (e.g., "Droplet", "Utensils", "Smile", "Clock", "Home", "User", "Heart", "Moon", "School", "HelpCircle")

Keep language extremely clear, direct, and accessible.`;

    const systemPrompt = buildSystemPrompt(profile) + `\n\nYou are an expert in Augmentative and Alternative Communication (AAC) boards.
Your task is to generate custom tiles in JSON format.
You MUST output ONLY a valid JSON object matching this schema:
{
  "tiles": [
    {
      "labelEn": "string",
      "labelMl": "string",
      "iconName": "string"
    }
  ]
}
Do NOT include markdown formatting, backticks, or wrapping like \`\`\`json in the response. Return ONLY raw JSON.`;

    // Try Gemini first
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`;
        const body = {
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [
                {
                    role: 'user',
                    parts: [{ text: userPrompt }]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                try {
                    const parsed = JSON.parse(text.trim());
                    if (parsed && Array.isArray(parsed.tiles)) {
                        return parsed.tiles;
                    }
                } catch (err) {
                    console.warn('Failed to parse Gemini AAC JSON response:', err);
                }
            }
        }
    }

    // Fallback to OpenAI
    const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (openAIKey) {
        const systemPromptOpenAI = systemPrompt + `\n\nRequired JSON Structure: { "tiles": [{ "labelEn": "string", "labelMl": "string", "iconName": "string" }] }`;
        const url = 'https://api.openai.com/v1/chat/completions';
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAIKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPromptOpenAI },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (res.ok) {
            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content;
            if (content) {
                try {
                    const parsed = JSON.parse(content.trim());
                    if (parsed && Array.isArray(parsed.tiles)) {
                        return parsed.tiles;
                    }
                } catch (err) {
                    console.warn('Failed to parse OpenAI AAC JSON response:', err);
                }
            }
        }
    }

    throw new Error('Could not generate contextual tiles. Check your API keys and connection.');
}


