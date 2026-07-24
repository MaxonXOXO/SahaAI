import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CUE_PROMPT = `You classify ONE current camera frame into an immediate mobility cue for a visually impaired person.
Return JSON only: {"command":"FORWARD"|"LEFT"|"RIGHT"|"STOP"|"CAUTION"|"SCAN","confidence":0..1,"cue":"very short factual reason"}.
Use LEFT or RIGHT only when a clear immediate directional instruction is visible. Use FORWARD only when the forward path is visibly clear enough to continue cautiously. Use STOP for a close obstacle, drop, step, or blocked path. Use CAUTION for uncertain terrain, obstacles, poor visibility, or a possible hazard. Use SCAN when the frame is insufficient or you cannot determine a safe immediate cue.
Never invent a route, destination, distance, or safety guarantee. Prefer SCAN or CAUTION when uncertain.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) return Response.json({ error: 'You must be signed in.' }, { status: 401, headers: corsHeaders });
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return Response.json({ error: 'Invalid session.' }, { status: 401, headers: corsHeaders });

    const { image } = await req.json();
    if (!image || typeof image !== 'string') return Response.json({ error: 'A camera image is required.' }, { status: 400, headers: corsHeaders });
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing from Edge Function secrets.');

    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: CUE_PROMPT }, { inlineData: { mimeType: 'image/jpeg', data: image } }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 100 },
      }),
    });
    if (!upstream.ok) return Response.json({ error: 'Gemini cue analysis failed.' }, { status: 502, headers: corsHeaders });
    const data = await upstream.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text || '{}');
    const allowed = new Set(['FORWARD', 'LEFT', 'RIGHT', 'STOP', 'CAUTION', 'SCAN']);
    const command = allowed.has(parsed.command) ? parsed.command : 'SCAN';
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
    return Response.json({ command, confidence, cue: String(parsed.cue || 'Scanning surroundings.').slice(0, 160) }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Navigator cue error:', error);
    return Response.json({ error: error.message || 'Could not analyze navigation cue.' }, { status: 500, headers: corsHeaders });
  }
});
