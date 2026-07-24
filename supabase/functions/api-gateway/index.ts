import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const text = (value: unknown, limit = 24000) => typeof value === 'string' ? value.slice(0, limit) : '';
const base64 = (value: unknown, limit = 7_000_000) => typeof value === 'string' && value.length <= limit ? value.replace(/^data:[^;]+;base64,/, '') : '';
const allowedVoices = new Set(['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'Puck', 'Kore', 'Charon', 'Aoede', 'Fenrir']);
const encodeBase64 = (bytes: Uint8Array) => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  return btoa(binary);
};

async function geminiGenerate(apiKey: string, body: unknown, model = 'gemini-3.1-flash-lite') {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Gemini request failed (${response.status}).`);
  return response.json();
}

async function openAI(apiKey: string, path: string, body: unknown) {
  const response = await fetch(`https://api.openai.com${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`OpenAI request failed (${response.status}).`);
  return response;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) return json({ error: 'You must be signed in.' }, 401);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: 'Invalid session.' }, 401);

    const request = await req.json();
    const action = text(request?.action, 64);
    const payload = request?.payload || {};
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const openAIKey = Deno.env.get('OPENAI_API_KEY');

    if (action === 'chat') {
      const provider = payload.provider === 'openai' ? 'openai' : 'gemini';
      const systemPrompt = text(payload.systemPrompt);
      const messages = Array.isArray(payload.messages) ? payload.messages.slice(-24).map((message: unknown) => {
        const item = message as Record<string, unknown>;
        return { role: item.role === 'assistant' ? 'assistant' : 'user', content: text(item.content, 12000) };
      }).filter((message) => message.content) : [];
      if (!systemPrompt || !messages.length) return json({ error: 'A prompt and message are required.' }, 400);
      if (provider === 'openai') {
        if (!openAIKey) throw new Error('OPENAI_API_KEY is not configured.');
        const response = await openAI(openAIKey, '/v1/chat/completions', { model: 'gpt-4o-mini', messages: [{ role: 'system', content: systemPrompt }, ...messages] });
        const data = await response.json();
        return json({ text: data?.choices?.[0]?.message?.content || '' });
      }
      if (!geminiKey) throw new Error('GEMINI_API_KEY is not configured.');
      const data = await geminiGenerate(geminiKey, {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: messages.map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] })),
      });
      return json({ text: data?.candidates?.[0]?.content?.parts?.[0]?.text || '' });
    }

    if (action === 'embedding') {
      if (!geminiKey) throw new Error('GEMINI_API_KEY is not configured.');
      const content = text(payload.text, 12000);
      if (!content) return json({ values: [] });
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        body: JSON.stringify({ model: 'models/gemini-embedding-001', content: { parts: [{ text: content }] }, outputDimensionality: 768 }),
      });
      if (!response.ok) throw new Error(`Gemini embedding request failed (${response.status}).`);
      const data = await response.json();
      return json({ values: Array.isArray(data?.embedding?.values) ? data.embedding.values : [] });
    }

    if (action === 'vision') {
      if (!geminiKey) throw new Error('GEMINI_API_KEY is not configured.');
      const image = base64(payload.image);
      const prompt = text(payload.prompt, 6000);
      if (!image || !prompt) return json({ error: 'An image and instruction are required.' }, 400);
      const data = await geminiGenerate(geminiKey, { contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: image } }] }] }, 'gemini-3.1-flash-lite');
      return json({ text: data?.candidates?.[0]?.content?.parts?.[0]?.text || '' });
    }

    if (action === 'ocr') {
      if (!openAIKey) throw new Error('OPENAI_API_KEY is not configured.');
      const image = base64(payload.image);
      const prompt = text(payload.prompt, 6000);
      if (!image || !prompt) return json({ error: 'An image and instruction are required.' }, 400);
      const response = await openAI(openAIKey, '/v1/chat/completions', { model: 'gpt-4o-mini', messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }] }] });
      const data = await response.json();
      return json({ text: data?.choices?.[0]?.message?.content || '' });
    }

    if (action === 'structured-json') {
      if (!openAIKey) throw new Error('OPENAI_API_KEY is not configured.');
      const prompt = text(payload.prompt);
      const schemaDescription = text(payload.schemaDescription);
      if (!prompt || !schemaDescription) return json({ error: 'Prompt and schema description are required.' }, 400);
      const systemPrompt = `You output only a valid JSON object matching this description. No markdown or commentary.\n\n${schemaDescription}`;
      const response = await openAI(openAIKey, '/v1/chat/completions', { model: 'gpt-4o-mini', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }], response_format: { type: 'json_object' } });
      const data = await response.json();
      return json({ text: data?.choices?.[0]?.message?.content || '' });
    }

    if (action === 'speech') {
      const provider = payload.provider === 'openai' ? 'openai' : 'gemini';
      const input = text(payload.text, 10000);
      const voice = allowedVoices.has(payload.voice) ? payload.voice : (provider === 'openai' ? 'alloy' : 'Puck');
      if (!input) return json({ error: 'Text is required.' }, 400);
      if (provider === 'openai') {
        if (!openAIKey) throw new Error('OPENAI_API_KEY is not configured.');
        const response = await openAI(openAIKey, '/v1/audio/speech', { model: 'tts-1', input, voice });
        const bytes = new Uint8Array(await response.arrayBuffer());
        return json({ audio: encodeBase64(bytes), mimeType: response.headers.get('content-type') || 'audio/mpeg' });
      }
      if (!geminiKey) throw new Error('GEMINI_API_KEY is not configured.');
      const data = await geminiGenerate(geminiKey, { contents: [{ role: 'user', parts: [{ text: input }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } }, 'gemini-3.1-flash-tts-preview');
      const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      return json({ audio: inlineData?.data || '', mimeType: inlineData?.mimeType || 'audio/L16;rate=24000' });
    }

    if (action === 'story-image') {
      if (!openAIKey) throw new Error('OPENAI_API_KEY is not configured.');
      const prompt = text(payload.prompt, 4000);
      if (!prompt) return json({ error: 'Prompt is required.' }, 400);
      const response = await openAI(openAIKey, '/v1/images/generations', { model: 'gpt-image-1', prompt, n: 1, size: '1024x1024', quality: 'low' });
      const data = await response.json();
      return json({ image: data?.data?.[0]?.b64_json || '' });
    }

    if (action === 'learn-image') {
      const accountId = Deno.env.get('CF_ACCOUNT_ID');
      const token = Deno.env.get('CF_API_TOKEN');
      const prompt = text(payload.prompt, 4000);
      if (!accountId || !token) throw new Error('Cloudflare AI secrets are not configured.');
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ prompt, num_steps: 4 }) });
      if (!response.ok) throw new Error(`Cloudflare image request failed (${response.status}).`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      return json({ image: encodeBase64(bytes), mimeType: response.headers.get('content-type') || 'image/png' });
    }

    if (action === 'youtube-search' || action === 'youtube-playlist') {
      const key = Deno.env.get('YOUTUBE_API_KEY');
      if (!key) throw new Error('YOUTUBE_API_KEY is not configured.');
      const params = new URLSearchParams(action === 'youtube-search'
        ? { part: 'snippet', q: text(payload.query, 500), type: 'video', maxResults: '1', safeSearch: 'strict', videoEmbeddable: 'true', relevanceLanguage: payload.language === 'ml' ? 'ml' : 'en', key }
        : { part: 'snippet', id: text(payload.playlistId, 200), key });
      const path = action === 'youtube-search' ? 'search' : 'playlists';
      const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${params}`);
      if (!response.ok) throw new Error(`YouTube request failed (${response.status}).`);
      const data = await response.json();
      return json({ item: data?.items?.[0] || null });
    }

    return json({ error: 'Unsupported API action.' }, 400);
  } catch (error) {
    console.error('API gateway error:', error);
    return json({ error: 'The secure AI service could not complete this request.' }, 502);
  }
});
