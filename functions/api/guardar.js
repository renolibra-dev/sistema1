export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const payload = await request.json();
    payload.id = Date.now().toString();

    if (env.SUPABASE_URL && env.SUPABASE_KEY) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/comprobantes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_KEY}`
        },
        body: JSON.stringify(payload)
      });
    }

    return new Response(JSON.stringify({ success: true, item: payload }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
