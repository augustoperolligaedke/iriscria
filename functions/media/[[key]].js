export async function onRequestGet({ params, env, request }) {
  const key = (params.key || []).join('/');
  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response('not found', { status: 404 });
  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set('etag', obj.httpEtag);
  h.set('cache-control', 'public, max-age=31536000, immutable');
  if (new URL(request.url).searchParams.has('download')) h.set('content-disposition', 'attachment; filename="' + key.split('/').pop() + '"');
  return new Response(obj.body, { headers: h });
}
