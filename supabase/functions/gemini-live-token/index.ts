import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) return Response.json({ error: 'You must be signed in.' }, { status: 401, headers: corsHeaders });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return Response.json({ error: 'Invalid session.' }, { status: 401, headers: corsHeaders });

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing from Edge Function secrets.');

    console.log('gemini-live-token handler entered', { userId: user.id });
    const now = Date.now();
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1alpha/auth_tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
      }),
    });

    const responseText = await upstream.text();
    if (!upstream.ok) {
      console.error('Gemini token API error:', upstream.status, responseText);
      return Response.json(
        { error: 'Gemini token provisioning failed.', detail: responseText },
        { status: upstream.status === 429 ? 429 : 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const token = JSON.parse(responseText);
    if (!token?.name) throw new Error('Gemini token API returned no token name.');

    return Response.json({ token: token.name }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Gemini ephemeral token error:', error);
    return Response.json({ error: error.message || 'Could not create Gemini Live token.' }, { status: 500, headers: corsHeaders });
  }
});
