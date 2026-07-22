import { buildSystemPrompt, safeParseJSON } from '../../../shared/lib/aiClient';
import { ROUTINE_ICON_NAMES } from './routineIcons';

/**
 * Ask the AI to suggest an ordered list of routine steps for a given title,
 * each matched to one of our existing Lucide icon names (so no image API
 * is ever required). Mirrors the Gemini-first, OpenAI-fallback pattern
 * already used by generateAACTiles in shared/lib/aiClient.js.
 *
 * Never throws — returns [] on any failure so callers can fall back to
 * manual step entry or a template.
 */
export async function generateRoutineSteps(title, profile) {
    if (!title || !title.trim()) return [];

    const iconNames = ROUTINE_ICON_NAMES;
    const userPrompt = `Suggest 5 to 8 clear, ordered steps for this routine: "${title}".
Each step must be one short, concrete action a person can actually do and check off.
Return JSON with a single root key "steps": an array of objects, each with:
- "label": short step text (max 6 words)
- "iconName": pick the single best-matching icon name from this exact list: ${iconNames.join(', ')}
Keep the order logical — the real sequence someone would do them in.`;

    const systemPrompt = `${buildSystemPrompt(profile || {})}

You are an expert in building visual routines and schedules for neurodivergent users (autism, ADHD).
You MUST output ONLY a valid JSON object matching this schema:
{ "steps": [ { "label": "string", "iconName": "string" } ] }
Do NOT include markdown formatting, backticks, or commentary. Return ONLY raw JSON.`;

    // Try Gemini first
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                    generationConfig: { responseMimeType: 'application/json' },
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                const parsed = text ? safeParseJSON(text) : null;
                if (parsed && Array.isArray(parsed.steps) && parsed.steps.length) {
                    return sanitizeSteps(parsed.steps, iconNames);
                }
            }
        } catch (err) {
            console.warn('Gemini routine step generation failed:', err);
        }
    }

    // Fallback to OpenAI
    const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (openAIKey) {
        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${openAIKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                    response_format: { type: 'json_object' },
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const content = data?.choices?.[0]?.message?.content;
                const parsed = content ? safeParseJSON(content) : null;
                if (parsed && Array.isArray(parsed.steps) && parsed.steps.length) {
                    return sanitizeSteps(parsed.steps, iconNames);
                }
            }
        } catch (err) {
            console.warn('OpenAI routine step generation failed:', err);
        }
    }

    return [];
}

function sanitizeSteps(steps, iconNames) {
    return steps
        .filter((s) => s && s.label)
        .slice(0, 8)
        .map((s) => ({
            label: String(s.label).slice(0, 60),
            iconName: iconNames.includes(s.iconName) ? s.iconName : 'Star',
        }));
}
