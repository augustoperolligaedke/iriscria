// Publica um conteúdo no Instagram conectado. O app manda as artes já renderizadas (JPEG em /media).
import { json, readJson, fail, now } from '../../../../lib/util.js';
import { requireUser } from '../../../../lib/auth.js';
import { one, run, parseContent } from '../../../../lib/db.js';
import { accountFor, publish, finishPending } from '../../../../lib/instagram.js';

export async function onRequestPost({ request, env, data, params }) {
  const u = requireUser(data);
  const c = parseContent(await one(env, 'SELECT * FROM contents WHERE id = ? AND user_id = ?', params.id, u.id));
  if (!c) fail(404, 'not_found', 'Conteúdo não encontrado.');
  if (c.ig_media_id) return json({ ok: true, permalink: c.ig_permalink, already: true });
  const acc = await accountFor(env, u.id);
  if (!acc) fail(400, 'ig_not_connected', 'Conecte seu Instagram para publicar.');
  if (acc.expired) fail(400, 'ig_expired', 'A conexão com o Instagram expirou. Conecte de novo.');
  const b = await readJson(request);
  const own = url => typeof url === 'string' && url.startsWith(`${env.APP_URL}/media/u/${u.id}/`);
  const copy = c.spec.copy || {};
  const caption = [copy.caption, (copy.hashtags || []).join(' ')].filter(Boolean).join('\n\n').slice(0, 2200);
  let r;
  if (c.ig_creation_id) r = await finishPending(env, acc, c.ig_creation_id);
  else {
    const imageUrls = (Array.isArray(b.image_urls) ? b.image_urls : []).filter(own);
    if (c.format !== 'reel' && !imageUrls.length) fail(400, 'no_images', 'Faltam as imagens da arte.');
    const videoUrl = c.output_key ? `${env.APP_URL}/media/${c.output_key}` : c.output_url;
    r = await publish(env, acc, { format: c.format, imageUrls, videoUrl, coverUrl: own(b.cover_url) ? b.cover_url : null, caption });
  }
  if (r.pending) {
    await run(env, 'UPDATE contents SET ig_creation_id=?, updated_at=? WHERE id=?', r.creation_id, now(), c.id);
    return json({ ok: true, pending: true });
  }
  await run(env, "UPDATE contents SET ig_media_id=?, ig_permalink=?, ig_creation_id=NULL, published_at=?, status='published', updated_at=? WHERE id=?", r.media_id, r.permalink, now(), now(), c.id);
  return json({ ok: true, permalink: r.permalink });
}
