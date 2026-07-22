import { buildSystemPrompt, sendMessage } from '../../shared/lib/aiClient';

const FALLBACK_EXPLAIN_PATTERN = /^(what|why|how|when|where|who)\b|\b(explain|define|meaning|difference between|tell me about)\b/i;

export default function useIntentClassifier(profile) {
    const classify = async (query) => {
        try {
            const reply = await sendMessage(
                `${buildSystemPrompt(profile)}\n\nClassify the user's message. Return ONLY JSON: {"intent":"explain"} for factual, educational, process, or topic questions; otherwise {"intent":"chat"}. If uncertain, choose chat.`,
                [{ role: 'user', content: query }]
            );
            const parsed = JSON.parse(reply.replace(/```json|```/gi, '').trim());
            return parsed.intent === 'explain' ? 'explain' : 'chat';
        } catch (error) {
            console.warn('Learn intent classification fell back to local heuristic:', error);
            return FALLBACK_EXPLAIN_PATTERN.test(query) ? 'explain' : 'chat';
        }
    };

    return { classify };
}
