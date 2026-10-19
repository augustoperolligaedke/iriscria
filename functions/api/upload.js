import { json, id, fail } from '../../lib/util.js';
import { requireUser } from '../../lib/auth.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export async function onRequestPost({ request, env, data }) {
  const u = requireUser(data);
  if (!env.MEDIA) fail(503, 'storage_off', 'O envio de fotos está temporariamente indisponível. Escolha uma foto da loja ou tente mais tarde.');
  const ct = (request.headers.get('content-type') || '').split(';')[0];
  if (!TYPES[ct]) fail(400, 'bad_type', 'Envie uma foto JPG, PNG ou WebP.');
  const len = Number(request.headers.get('content-length') || 0);
  if (len > 15 * 1024 * 1024) fail(413, 'too_large', 'Foto acima de 15 MB.');
  const key = `u/${u.id}/${id('m_')}.${TYPES[ct]}`;
  await env.MEDIA.put(key, request.body, { httpMetadata: { contentType: ct } });
  return json({ ok: true, key, url: `${env.APP_URL}/media/${key}` });
}
