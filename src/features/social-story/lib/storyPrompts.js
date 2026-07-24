/**
 * storyPrompts.js — AI prompt builder for generating custom social stories,
 * plus image generation via Cloudflare Workers AI (SDXL Lightning).
 *
 * Uses the generateStructuredJSON helper from aiClient to get a story
 * in the same format as prebuiltStories pages.
 */
import { generateStructuredJSON } from '../../../shared/lib/aiClient';

// ── Image cache ───────────────────────────────────────────────────────────────
// Module-level Map persists for the browser session (cleared on full page reload).
// Keys: story.id for prebuilt stories; null/undefined for ephemeral AI page images.
// Values: blob: URLs created from Cloudflare Workers AI responses.
//
// Exported so LibraryTab can read cached thumbnails on re-mount without
// needing subscriptions — LibraryTab always re-mounts when returning from
// ReadStoryView, so stale state is never an issue.
export const storyImageCache = new Map();

// In-flight request de-duplication: if the same cacheKey is requested again
// before the first call resolves (e.g. the user taps Next quickly, or the
// current-page load and the next-page prefetch race), reuse the same promise
// instead of firing a second paid image generation call.
const pendingImageRequests = new Map();

/**
 * Generate a flat-cartoon illustration using Cloudflare Workers AI (SDXL Lightning).
 *
 * @param {string} imagePrompt      — Scene description (20–40 words)
 * @param {string|null} cacheKey    — If provided, result is cached for the session
 * @returns {Promise<string>}       — Blob URL (efficient; no localStorage needed)
 */
export async function generateStoryImage(imagePrompt, cacheKey = null) {
  // Serve from cache if available
  if (cacheKey && storyImageCache.has(cacheKey)) {
    return storyImageCache.get(cacheKey);
  }

  // Serve the same in-flight request if one is already running for this key
  if (cacheKey && pendingImageRequests.has(cacheKey)) {
    return pendingImageRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    let userToken = '';
    let userAccountId = '';
    try {
      userToken = localStorage.getItem('saha_cf_api_token') || '';
      userAccountId = localStorage.getItem('saha_cf_account_id') || '';
    } catch (e) {
      console.warn('[StoryPrompts] Failed to read CF keys from localStorage:', e);
    }
    const accountId = userAccountId || import.meta.env.VITE_CF_ACCOUNT_ID || '';
    const apiToken = userToken || import.meta.env.VITE_CF_API_TOKEN || '';
    if (!accountId || !apiToken) {
      throw new Error('Missing VITE_CF_ACCOUNT_ID or VITE_CF_API_TOKEN in environment');
    }

    const fullPrompt = [
      "Simple, friendly flat-cartoon illustration for a children's social story book.",
      `Scene: ${imagePrompt}.`,
      'Style: warm pastel colors, clean bold outlines, minimal background detail,',
      'cheerful and calming, suitable for children aged 5–15 with autism.',
      'Absolutely no text, letters, numbers, or words anywhere in the image.',
    ].join(' ');

    const model = '@cf/bytedance/stable-diffusion-xl-lightning';

    // Try Vite proxy endpoint first, then direct Cloudflare API endpoint
    const endpoints = [
      `/cf-ai/client/v4/accounts/${accountId}/ai/run/${model}`,
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`
    ];

    let response = null;
    let lastErr = null;

    for (const url of endpoints) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (apiToken) {
          headers['Authorization'] = `Bearer ${apiToken}`;
        }

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ prompt: fullPrompt, num_steps: 4 }),
        });

        if (res.ok) {
          response = res;
          console.log('[StoryPrompts] Cloudflare Workers AI succeeded with model:', model);
          break;
        }

        const errText = await res.text();
        lastErr = `${url} → ${res.status}: ${errText}`;
        console.warn('[StoryPrompts] Workers AI endpoint failed:', lastErr);
      } catch (err) {
        lastErr = `${url} → fetch error: ${err.message}`;
        console.warn('[StoryPrompts] Fetch error calling Cloudflare Workers AI:', lastErr);
      }
    }

    if (!response) {
      throw new Error(`Cloudflare Workers AI image generation failed: ${lastErr || 'Unknown error'}`);
    }

    let blob = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await response.json();
      const b64 = json?.result?.image || json?.result;
      if (typeof b64 === 'string') {
        const byteChars = atob(b64.includes('base64,') ? b64.split('base64,')[1] : b64);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        blob = new Blob([byteArr], { type: 'image/png' });
      }
    } else {
      blob = await response.blob();
    }

    if (!blob || blob.size === 0) {
      throw new Error('No image data returned from Cloudflare Workers AI');
    }

    const blobUrl = URL.createObjectURL(blob);

    if (cacheKey) storyImageCache.set(cacheKey, blobUrl);
    return blobUrl;
  })();

  if (cacheKey) {
    pendingImageRequests.set(cacheKey, requestPromise);
    requestPromise.finally(() => pendingImageRequests.delete(cacheKey));
  }

  return requestPromise;
}

// ── Scenario templates ────────────────────────────────────────────────────────
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

// ── Story generation ──────────────────────────────────────────────────────────
/**
 * Generate a custom social story using AI.
 * Each page now includes an imagePrompt for lazy illustration generation.
 *
 * @param {string} scenario  — Description of the situation
 * @param {Object} profile   — From useProfileStore (name, needs, language)
 * @returns {Promise<Object>} — { title, emoji, coverImagePrompt, pages: [{ text, tip, imagePrompt }] }
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
- Each page should have an "imagePrompt": a short (15–25 word) description of a simple, friendly cartoon scene that illustrates the page for a children's social story.
- Include a "coverImagePrompt": a short (15–25 word) description of a warm, friendly cartoon scene that captures the overall theme of this story.
- Include an appropriate single emoji for the story title.
- The title should be short (3–6 words).`;

  const schemaDescription = `{
  "title": "string — short title for the story (3-6 words)",
  "emoji": "string — a single emoji that represents the story",
  "coverImagePrompt": "string — 15-25 word scene description for the story cover illustration",
  "pages": [
    {
      "text": "string — 1-2 short sentences for this page, first person",
      "tip": "string — 1 short practical tip or coping strategy",
      "imagePrompt": "string — 15-25 word scene description for a cartoon illustration of this page"
    }
  ]
}
The pages array should have 5-7 items.`;

  const result = await generateStructuredJSON(prompt, schemaDescription);
  return result;
}
