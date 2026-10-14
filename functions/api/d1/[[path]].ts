/**
 * Cloudflare Pages Function Proxy for D1 API
 * Handles all requests to /api/d1/* and proxies them to the D1 worker.
 */

export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Extract the path after /api/d1
  const subPath = url.pathname.replace(/^\/api\/d1/, '') || '/';
  const targetUrl = `https://raporkita-db.dianrizkisofiawan0431.workers.dev${subPath}${url.search}`;

  try {
    const fetchInit: RequestInit = {
      method: request.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': request.headers.get('content-type') || 'application/json'
      }
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text();
      if (body) {
        fetchInit.body = body;
      }
    }

    const response = await fetch(targetUrl, fetchInit);
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('content-type') || 'application/json'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
