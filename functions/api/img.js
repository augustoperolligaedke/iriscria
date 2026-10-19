// Proxy de imagem para renderizar as artes no navegador sem bloqueio de CORS.
export async function onRequestGet({ request, env, data }) {
  const u = new URL(request.url).searchParams.get('u') || '';
  if (!/^https?:\/\//i.test(u)) return new Response('bad url', { status: 400 });
  const target = new URL(u);
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(target.hostname) || target.hostname === '[::1]') return new Response('blocked', { status: 400 });
  const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', accept: 'image/avif,image/webp,image/*,*/*;q=0.8' }, signal: AbortSignal.timeout(10000), cf: { cacheTtl: 86400 } });
  if (!r.ok) return new Response('upstream ' + r.status, { status: 502 });
  const ct = (r.headers.get('content-type') || '').split(';')[0];
  if (!ct.startsWith('image/')) return new Response('not image', { status: 415 });
  const len = Number(r.headers.get('content-length') || 0);
  if (len > 12 * 1024 * 1024) return new Response('too large', { status: 413 });
  return new Response(r.body, { headers: { 'content-type': ct, 'cache-control': 'public, max-age=86400' } });
}
