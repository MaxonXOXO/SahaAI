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
