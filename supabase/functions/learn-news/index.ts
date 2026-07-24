import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const decodeXml = (value = '') => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .trim();

const tagValue = (xml: string, tag: string) => {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return decodeXml(match?.[1] || '');
};

const profileQuery = (region: string, ageRange: string | null) => {
  const localRegion = region && !['Other Region', 'Outside India'].includes(region) ? region : 'India';
  const youthTopics = 'education OR science OR technology OR environment OR sports';
  const generalTopics = 'education OR science OR technology OR health OR community';
  const topics = ageRange === 'under_13' || ageRange === '13_17' ? youthTopics : generalTopics;
  return `${localRegion} (${topics}) -crime -violence -accident -election`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) return Response.json({ error: 'You must be signed in.' }, { status: 401, headers: corsHeaders });
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return Response.json({ error: 'Invalid session.' }, { status: 401, headers: corsHeaders });

    const { data: profile } = await supabase.from('profiles').select('region, age_range, language').eq('id', user.id).single();
    const isMalayalam = profile?.language === 'ml';
    const query = profileQuery(profile?.region || '', profile?.age_range || null);
    const params = new URLSearchParams({ q: query, hl: isMalayalam ? 'ml' : 'en-IN', gl: 'IN', ceid: isMalayalam ? 'IN:ml' : 'IN:en' });
    const rss = await fetch(`https://news.google.com/rss/search?${params.toString()}`, { headers: { 'User-Agent': 'SahaAI-Learn/1.0' } });
    if (!rss.ok) throw new Error(`News feed returned ${rss.status}`);
    const xml = await rss.text();
    const articles = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 10).map((match) => {
      const item = match[1];
      const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
      return {
        title: tagValue(item, 'title').replace(/\s+-\s+[^-]+$/, ''),
        url: tagValue(item, 'link'),
        publishedAt: tagValue(item, 'pubDate'),
        source: decodeXml(sourceMatch?.[1] || 'News'),
      };
    }).filter((article) => article.title && article.url);

    return Response.json({ articles, region: profile?.region || 'India', query }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Learn news error:', error);
    return Response.json({ error: error.message || 'Could not load news.' }, { status: 500, headers: corsHeaders });
  }
});
