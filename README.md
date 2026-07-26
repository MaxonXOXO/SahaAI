# SahaAI

SahaAI is an accessibility-first AI companion that helps people communicate, learn, read, navigate, and manage everyday routines with greater independence. It brings personalised accessibility settings, voice interaction, camera-assisted tools, and multilingual support into one mobile-first web application.

## The problem

People with diverse accessibility needs often have to move between disconnected tools for communication, reading, learning, navigation, and daily planning. Those tools are rarely personalised to the person's language, visual needs, attention needs, or preferred way of interacting.

## The solution

SahaAI adapts its interface and assistance to the user. It supports accessibility preferences such as low vision, dyslexia, ADHD, autism, and dyscalculia; offers light, dark, soft-contrast, and maximum-contrast themes; and provides English and Malayalam experiences. Voice, camera input, text, and touch controls give users multiple ways to use the app.

## Features

### Personalisation and accessibility

- Onboarding for language, age range, approximate region, and accessibility needs.
- Theme and contrast choices: Light, Dark Standard, Soft Contrast, and Maximum Contrast.
- Low-vision adjustments including high contrast, large touch targets, clearer focus states, and readable colour combinations.
- Display controls for font style, size, and text thickness.
- English and Malayalam UI support.

### Everyday assistance

- **Vision Assistant** — capture a still camera image to identify objects, describe scenes, extract text, read signs, answer questions about a photo, and assist with Indian currency recognition.
- **Visual Navigator** — a camera-and-voice navigation experience backed by a realtime Gemini session, with structured cues such as forward, left, right, caution, stop, and scan.
- **Read Text** — document and image text reading with OCR and spoken output.
- **AAC Board** — augmentative and alternative communication cards with speech output, including Malayalam fallback speech support.
- **AI Chat** — conversational assistance with fast in-browser listen, pause, and replay controls.

### Learning and wellbeing

- **Learn Feed** — personalised learning cards, relevant local-news feed, explanations, steps, and automatically generated visual aids.
- **Social Stories** — AI-assisted social-story creation with generated illustrations.
- **Math Helper** — guided problem solving, instant solver, scanner support, and accessible math rendering.
- **Focus Mode** — focused sessions with a distraction-reduced interface.
- **Routine Builder** — create and follow repeatable daily routines.
- **Speech Therapy** — realtime speech practice, live transcript, microphone controls, and session flow.
- **Dear Diary & Memory** — journal entries, mood selection, memory notes, and voice input.
- **Progress** — a simple user-scoped view of recent activity, tools used, and days of use.

## Technology

- **Frontend:** React 19, Vite, React Router, Tailwind CSS, Zustand, Framer Motion
- **Backend:** Supabase Auth, database, Storage, and Edge Functions
- **AI services:** Gemini for multimodal and realtime experiences; OpenAI for selected generated content; Cloudflare Workers AI for learning visuals
- **Other capabilities:** browser speech synthesis/recognition, camera APIs, i18next, KaTeX, PDF.js, and Lucide icons

## Architecture and API security

The browser only receives the public Supabase project URL and anon key. Provider API keys are not exposed as `VITE_` variables.

| Edge Function | Responsibility |
| --- | --- |
| `api-gateway` | Authenticated server-side gateway for AI providers, including vision analysis, image generation, speech, and related requests. |
| `gemini-live-token` | Creates short-lived configuration/token data for Gemini Live sessions. |
| `navigator-cue` | Converts navigation context into a compact structured UI cue. |
| `learn-news` | Retrieves and prepares relevant news items for the Learn feed. |

## Local development

### Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project
- Supabase CLI, if you want to run or deploy Edge Functions locally

### Install and run

```bash
git clone https://github.com/MaxonXOXO/SahaAI.git
cd SahaAI
npm install
copy env.example .env
npm run dev
```

On macOS/Linux, use `cp env.example .env` instead of `copy`.

### Client environment variables

Add only the public Supabase configuration to `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### Edge Function secrets

Configure provider credentials as Supabase Edge Function secrets, never in the client `.env` file:

```text
GEMINI_API_KEY
OPENAI_API_KEY
YOUTUBE_API_KEY
CF_ACCOUNT_ID
CF_API_TOKEN
```

When setting secrets in the Supabase dashboard, paste raw values without surrounding quotation marks. In particular, quotes included in a deployed Cloudflare token value will make the token invalid.

## Database and Edge Functions

Apply the SQL migrations in `supabase/migrations/` to your Supabase project. Then deploy the required functions:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy api-gateway
supabase functions deploy gemini-live-token
supabase functions deploy navigator-cue
supabase functions deploy learn-news
```

Set secrets with the CLI if preferred:

```bash
supabase secrets set GEMINI_API_KEY=YOUR_VALUE
supabase secrets set OPENAI_API_KEY=YOUR_VALUE
supabase secrets set CF_ACCOUNT_ID=YOUR_VALUE
supabase secrets set CF_API_TOKEN=YOUR_VALUE
```

## Quality checks

```bash
npm run build
npm run lint
```

`npm run build` creates the production bundle in `dist/`.

## Deployment

The frontend can be deployed to Vercel. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project environment settings, then deploy from the `master` branch. Deploy Supabase Edge Functions and configure their secrets separately before testing AI-powered features in production.

## Privacy and safety notes

- Camera permissions are requested by the relevant feature and should be granted only when the user chooses to use it.
- Vision Assistant analyses user-captured still images; it is not a replacement for professional mobility, medical, financial, or emergency guidance.
- Visual Navigator provides supportive scene cues and must not be relied on as the sole source of safe navigation.
- External AI responses can be incomplete or incorrect; SahaAI presents them as assistance, not certainty.

## Project structure

```text
src/
  app/                 Routes and app shell
  features/            User-facing feature modules
  shared/              Reusable components, hooks, i18n, and API clients
  store/               Client-side user and preference state
supabase/
  functions/           Secure server-side integrations
  migrations/          Database schema migrations
```

## License

This project is currently private and does not include an open-source license.
