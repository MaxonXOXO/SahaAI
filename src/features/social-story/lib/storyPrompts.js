/**
 * storyPrompts.js — AI prompt builder for generating custom social stories.
 *
 * Uses the generateStructuredJSON helper from aiClient to get a story
 * in the same format as prebuiltStories pages.
 */
import { generateStructuredJSON } from '../../../shared/lib/aiClient';

/**
 * Common scenario templates the user can pick from to seed a custom story.
 */
export const SCENARIO_TEMPLATES = [
  {
    id: 'custom',
    label: 'Write My Own',
    emoji: '✏️',
    description: 'Describe any situation in your own words',
  },
  {
    id: 'new-place',
    label: 'Going Somewhere New',
    emoji: '🗺️',
    description: 'Visiting an unfamiliar place',
    prompt: 'going to a new or unfamiliar place for the first time',
  },
  {
    id: 'change-routine',
    label: 'Change in Routine',
    emoji: '🔄',
    description: 'When plans change unexpectedly',
    prompt: 'handling an unexpected change in daily routine',
  },
  {
    id: 'sensory-overload',
    label: 'Sensory Overload',
    emoji: '🔊',
    description: 'Coping with loud or busy environments',
    prompt: 'dealing with sensory overload in a noisy or crowded environment',
  },
  {
    id: 'asking-for-help',
    label: 'Asking for Help',
    emoji: '🙋',
    description: 'How to ask someone for help',
    prompt: 'asking a teacher, parent, or peer for help when I need it',
  },
  {
    id: 'sharing-toys',
    label: 'Sharing & Taking Turns',
    emoji: '🎮',
    description: 'Learning to share with others',
    prompt: 'sharing toys or taking turns during a game with other children',
  },
  {
    id: 'eating-out',
    label: 'Eating at a Restaurant',
    emoji: '🍽️',
    description: 'What to expect when dining out',
    prompt: 'going to a restaurant, ordering food, and waiting for the meal',
  },
  {
    id: 'birthday-party',
    label: 'Going to a Party',
    emoji: '🎂',
    description: 'Attending a birthday party',
    prompt: 'attending a birthday party with other children',
  },
];

/**
 * Generate a custom social story using AI.
 *
 * @param {string} scenario — Description of the situation
 * @param {Object} profile — From useProfileStore (for name, needs, language)
 * @returns {Promise<Object>} — { title, emoji, pages: [{ text, tip }] }
 */
export async function generateSocialStory(scenario, profile = {}) {
  const userName = profile.name || profile.username || 'the reader';
  const language = profile.language === 'ml' ? 'Malayalam' : 'English';

  const prompt = `Create a social story for a person named "${userName}" about the following situation:

"${scenario}"

The story is meant for someone who is autistic and benefits from clear, literal, predictable language. Write in ${language}.

Rules:
- Write 5–7 pages (steps).
- Each page should have 1–2 short, simple sentences.
- Use first person ("I").
- Be warm, reassuring, and concrete — no metaphors, idioms, or sarcasm.
- Each page should also have a short practical "tip" (1 sentence) that gives a helpful coping strategy or reminder.
- Include an appropriate single emoji for the story title.
- The title should be short (3–6 words).`;

  const schemaDescription = `{
  "title": "string — short title for the story (3-6 words)",
  "emoji": "string — a single emoji that represents the story",
  "pages": [
    {
      "text": "string — 1-2 short sentences for this page, first person",
      "tip": "string — 1 short practical tip or coping strategy"
    }
  ]
}
The pages array should have 5-7 items.`;

  const result = await generateStructuredJSON(prompt, schemaDescription);
  return result;
}
