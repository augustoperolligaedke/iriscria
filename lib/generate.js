import { now, id, fail, period } from './util.js';
import { one, run, all, parseContent } from './db.js';
import { PLANS, GIFT, isPost, planOf } from './plans.js';
import { writeCopy } from './llm.js';
import { FUNNEL, videoPrompt } from './playbook.js';
import { hfEnabled, uploadToHf, submitReel, requestStatus } from './higgsfield.js';

export async function usageFor(env, user) {
  const p = period();
  const u = (await one(env, 'SELECT posts, reels FROM usage WHERE user_id = ? AND period = ?', user.id, p)) || { posts: 0, reels: 0 };
  const plan = planOf(user), lim = PLANS[plan].monthly;
  const gift = await one(env, 'SELECT SUM(CASE WHEN format=\'reel\' THEN 1 ELSE 0 END) reels, SUM(CASE WHEN format!=\'reel\' THEN 1 ELSE 0 END) posts FROM contents WHERE user_id = ? AND gift = 1 AND status != \'failed\'', user.id);
  return { period: p, plan, used: u, limit: lim, left: { posts: Math.max(0, lim.posts - u.posts), reels: Math.max(0, lim.reels - u.reels) },
    gift: { posts: Math.max(0, GIFT.posts - (gift?.posts || 0)), reels: Math.max(0, GIFT.reels - (gift?.reels || 0)) } };
}

export async function createContent(env, user, brand, product, { format, offer, gift = false }) {
  if (!['feed', 'carousel', 'reel'].includes(format)) fail(400, 'bad_format');
  const usage = await usageFor(env, user);
  const kind = isPost(format) ? 'posts' : 'reels';
  let useGift = false;
  if (gift && usage.gift[kind] > 0) useGift = true;
  else if (usage.left[kind] <= 0) fail(402, 'no_credits', usage.limit[kind] === 0 ? (kind === 'reels' ? 'Reels não fazem parte do plano grátis. Assine o Básico para criar vídeos.' : 'Seu plano não inclui posts.') : kind === 'reels' ? 'Você já usou os reels deste mês. Faça upgrade para continuar.' : 'Você já usou os posts deste mês. Faça upgrade para continuar.');

  const copy = await writeCopy(env, { format, brand, product, offer });
  const cid = id('c_'), t = now();
  const spec = { copy, funnel: FUNNEL[format].stage, offer: FUNNEL[format].stage === 'topo' ? null : (offer || null), product: { name: product.name, price: product.price, image_url: product.image_url }, brand: { name: brand.name, colors: brand.colors, font: brand.font, instagram: brand.instagram } };
  let status = 'completed', provider = null, reqId = null;
  if (format === 'reel') {
    if (hfEnabled(env)) {
      try {
        const img = await fetchImage(env, product);
        const publicUrl = await uploadToHf(env, img.bytes, img.contentType);
        const sub = await submitReel(env, { imageUrl: publicUrl, prompt: copy.video_prompt || videoPrompt('', 'motion'), duration: 5 });
        status = 'queued'; provider = 'higgsfield'; reqId = sub.request_id;
      } catch (e) { console.error('reel submit', e); status = 'failed'; spec.error = String(e.message || e); }
    } else { spec.mock = true; provider = 'mock'; }
  }
  await run(env, 'INSERT INTO contents (id,user_id,brand_id,product_id,format,status,spec,provider,provider_request_id,gift,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    cid, user.id, brand.id, product.id, format, status, JSON.stringify(spec), provider, reqId, useGift ? 1 : 0, t, t);
  if (!useGift && status !== 'failed') {
    await run(env, `INSERT INTO usage (user_id, period, posts, reels) VALUES (?,?,?,?) ON CONFLICT(user_id, period) DO UPDATE SET posts = usage.posts + excluded.posts, reels = usage.reels + excluded.reels`,
      user.id, usage.period, kind === 'posts' ? 1 : 0, kind === 'reels' ? 1 : 0);
  }
  return parseContent(await one(env, 'SELECT * FROM contents WHERE id = ?', cid));
}

export async function refreshContent(env, c) {
  if (c.provider !== 'higgsfield' || !c.provider_request_id || ['completed', 'failed', 'approved'].includes(c.status)) return c;
  try {
    const s = await requestStatus(env, c.provider_request_id);
    if (s.status === 'completed' && s.video?.url) {
      let key = null;
      try { key = await copyToR2(env, s.video.url, c.user_id, 'mp4', 'video/mp4'); } catch (e) { console.error('copy video', e); }
      await run(env, 'UPDATE contents SET status=?, output_url=?, output_key=?, updated_at=? WHERE id=?', 'completed', s.video.url, key, now(), c.id);
    } else if (['failed', 'nsfw', 'canceled'].includes(s.status)) {
      await run(env, 'UPDATE contents SET status=?, error=?, updated_at=? WHERE id=?', 'failed', s.status + (s.error ? ': ' + JSON.stringify(s.error) : ''), now(), c.id);
    } else if (s.status !== c.status) {
      await run(env, 'UPDATE contents SET status=?, updated_at=? WHERE id=?', s.status, now(), c.id);
    }
  } catch (e) { console.error('refresh', e); }
  return parseContent(await one(env, 'SELECT * FROM contents WHERE id = ?', c.id));
}

async function fetchImage(env, product) {
  if (product.image_key) {
    const obj = await env.MEDIA.get(product.image_key);
    if (obj) return { bytes: await obj.arrayBuffer(), contentType: obj.httpMetadata?.contentType || 'image/jpeg' };
  }
  const r = await fetch(product.image_url, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error('Não consegui baixar a foto do produto.');
  const ct = (r.headers.get('content-type') || 'image/jpeg').split(';')[0];
  return { bytes: await r.arrayBuffer(), contentType: ct.startsWith('image/') ? ct : 'image/jpeg' };
}
export async function copyToR2(env, url, userId, ext, contentType) {
  const r = await fetch(url); if (!r.ok) throw new Error('download ' + r.status);
  const key = `u/${userId}/${id('m_')}.${ext}`;
  await env.MEDIA.put(key, r.body, { httpMetadata: { contentType } });
  return key;
}
export const mediaUrl = (env, key) => `${env.APP_URL}/media/${key}`;
