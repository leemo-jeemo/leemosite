export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_KEY;
    const url = new URL(request.url);

    try {
      // GET quotes (public) - MUST be before generic GET handler
      if (url.pathname === '/quotes' && request.method === 'GET') {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/quotes?select=*`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // POST quote (public, with cuss filter)
      if (url.pathname === '/quotes' && request.method === 'POST') {
        const body = await request.json();
        const cussWords = ['fuck', 'shit', 'ass', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'nigger', 'nigga', 'chink', 'fag', 'ngger', 'ngga', 'slut', 'ching chong', 'retard', 'retrd', 'returd', 'rape', 'rapist', 'raping', 'raper'];
        const containsCuss = cussWords.some(word =>
          body.quote.toLowerCase().includes(word) ||
          body.author.toLowerCase().includes(word)
        );
        if (containsCuss) {
          return new Response(JSON.stringify({ error: 'Quote contains inappropriate language' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const res = await fetch(`${SUPABASE_URL}/rest/v1/quotes`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({ quote: body.quote, author: body.author }),
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET todos (public) - catches GET requests to root path
      if (request.method === 'GET') {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/todos?select=*&order=created_at.asc`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // POST and DELETE require auth token
      const auth = request.headers.get('Authorization');
      if (auth !== `Bearer ${env.AUTH_TOKEN}`) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      // POST - add a todo
      if (request.method === 'POST') {
        const body = await request.json();
        const res = await fetch(`${SUPABASE_URL}/rest/v1/todos`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({ text: body.text }),
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // DELETE - remove a todo
      if (request.method === 'DELETE') {
        const body = await request.json();
        const res = await fetch(`${SUPABASE_URL}/rest/v1/todos?id=eq.${body.id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        });
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
};
