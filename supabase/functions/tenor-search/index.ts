import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 20 } = await req.json();
    
    const apiKey = Deno.env.get('TENOR_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Tenor API key not configured', results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&client_key=aurorachat&limit=${limit}&media_filter=gif,tinygif`;
    
    const response = await fetch(url);
    const data = await response.json();

    const results = (data.results || []).map((gif: any) => ({
      id: gif.id,
      title: gif.title || '',
      preview: gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url || '',
      url: gif.media_formats?.gif?.url || '',
    }));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, results: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
