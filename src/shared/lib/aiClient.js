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

/**
 * Send a conversation to Gemini and get the assistant reply.
 * @param {string} systemPrompt — built from buildSystemPrompt()
 * @param {Array<{role: string, content: string}>} messages — chat history (role: 'user' | 'assistant')
 * @returns {Promise<string>} — assistant reply text
 */
export async function sendMessage(systemPrompt, messages) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing VITE_GEMINI_API_KEY in .env');
    }

    console.log('[AI Client] Sending request with key prefix:', apiKey.slice(0, 8), '... length:', apiKey.length);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

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
