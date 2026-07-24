import { buildSystemPrompt, safeParseJSON, sendMessage } from '../../../shared/lib/aiClient';
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

    for (const provider of ['gemini', 'openai']) {
        try {
            const parsed = safeParseJSON(await sendMessage(systemPrompt, [{ role: 'user', content: userPrompt }], { provider }));
            if (parsed && Array.isArray(parsed.steps) && parsed.steps.length) return sanitizeSteps(parsed.steps, iconNames);
        } catch (err) { console.warn(`${provider} routine step generation failed:`, err); }
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
