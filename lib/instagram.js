// Instagram API com login do Instagram (contas comerciais e de criador, sem página do Facebook).
// Permissões: instagram_business_basic + instagram_business_content_publish.
// Sem IG_APP_ID/IG_APP_SECRET o recurso fica desligado no app.
import { fail, now } from './util.js';
import { one, run } from './db.js';

const SCOPES = 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights';
const V = env => env.IG_GRAPH_VERSION || 'v23.0';
const GRAPH = env => `https://graph.instagram.com/${V(env)}`;

export const igEnabled = env => !!(env.IG_APP_ID && env.IG_APP_SECRET);
export const redirectUri = env => `${env.APP_URL}/api/instagram/callback`;

export function authorizeUrl(env, state) {
  const u = new URL('https://www.instagram.com/oauth/authorize');
  u.search = new URLSearchParams({ client_id: env.IG_APP_ID, redirect_uri: redirectUri(env), response_type: 'code', scope: SCOPES, state, enable_fb_login: 'false', force_reauth: 'true' });
  return u.href;
}

async function igFetch(url, init) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error || d.error_message) {
    const msg = d.error?.message || d.error_message || 'erro ' + r.status;
    console.error('instagram', url.split('?')[0], msg);
    fail(502, 'instagram_error', 'O Instagram recusou: ' + msg);
  }
  return d;
}

// código → token curto → token longo (60 dias) → conta
export async function connectAccount(env, userId, code) {
  const short = await igFetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST', body: new URLSearchParams({ client_id: env.IG_APP_ID, client_secret: env.IG_APP_SECRET, grant_type: 'authorization_code', redirect_uri: redirectUri(env), code: code.replace(/#_$/, '') }),
  });
  // a resposta vem como { data: [{ access_token, user_id, permissions }] }; versões antigas mandavam na raiz
  const first = Array.isArray(short.data) ? short.data[0] || {} : short;
  if (!first.access_token) fail(502, 'instagram_error', 'O Instagram não devolveu o acesso. Tente conectar de novo.');
  const perms = String(first.permissions || '');
  if (perms && !perms.includes('instagram_business_content_publish')) fail(400, 'ig_permission', 'Para publicar, autorize a permissão de publicação no Instagram.');
  const long = await igFetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(env.IG_APP_SECRET)}&access_token=${encodeURIComponent(first.access_token)}`);
  const me = await igFetch(`${GRAPH(env)}/me?fields=user_id,username,account_type,profile_picture_url&access_token=${encodeURIComponent(long.access_token)}`);
  const expires = new Date(Date.now() + (long.expires_in || 5184000) * 1000).toISOString();
  await run(env, `INSERT INTO instagram_accounts (user_id, ig_user_id, username, account_type, picture_url, access_token, expires_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET ig_user_id=excluded.ig_user_id, username=excluded.username, account_type=excluded.account_type, picture_url=excluded.picture_url, access_token=excluded.access_token, expires_at=excluded.expires_at, updated_at=excluded.updated_at`,
    userId, String(me.user_id || me.id), me.username || null, me.account_type || null, me.profile_picture_url || null, long.access_token, expires, now(), now());
  return { username: me.username };
}

export async function accountFor(env, userId) {
  const a = await one(env, 'SELECT * FROM instagram_accounts WHERE user_id = ?', userId);
  if (!a) return null;
  if (a.expires_at < now()) return { ...a, expired: true };
  // renova quando faltam menos de 10 dias
  if (new Date(a.expires_at) - Date.now() < 10 * 86400e3) {
    try {
      const d = await igFetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(a.access_token)}`);
      const exp = new Date(Date.now() + (d.expires_in || 5184000) * 1000).toISOString();
      await run(env, 'UPDATE instagram_accounts SET access_token=?, expires_at=?, updated_at=? WHERE user_id=?', d.access_token, exp, now(), userId);
      return { ...a, access_token: d.access_token, expires_at: exp };
    } catch { }
  }
  return a;
}

const post = (env, path, params, token) => igFetch(`${GRAPH(env)}/${path}`, { method: 'POST', body: new URLSearchParams({ ...params, access_token: token }) });

async function waitReady(env, containerId, token, maxMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const s = await igFetch(`${GRAPH(env)}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(token)}`);
    if (s.status_code === 'FINISHED') return true;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') fail(502, 'instagram_media', 'O Instagram não aceitou a mídia: ' + (s.status || s.status_code));
    await new Promise(r => setTimeout(r, 3000));
  }
  return false;
}

// Publica. Imagens precisam ser JPEG em URL pública; reels precisa de MP4 em URL pública.
export async function publish(env, acc, { format, imageUrls = [], videoUrl, coverUrl, caption }) {
  const tok = acc.access_token, me = acc.ig_user_id;
  let creation;
  if (format === 'feed') {
    creation = (await post(env, `${me}/media`, { image_url: imageUrls[0], caption }, tok)).id;
  } else if (format === 'carousel') {
    if (imageUrls.length < 2) fail(400, 'carousel_size', 'O carrossel precisa de pelo menos 2 imagens.');
    const children = [];
    for (const u of imageUrls.slice(0, 10)) children.push((await post(env, `${me}/media`, { image_url: u, is_carousel_item: 'true' }, tok)).id);
    creation = (await post(env, `${me}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption }, tok)).id;
  } else if (format === 'reel') {
    if (!videoUrl) fail(400, 'no_video', 'O vídeo do reels ainda não está pronto.');
    creation = (await post(env, `${me}/media`, { media_type: 'REELS', video_url: videoUrl, caption, share_to_feed: 'true', ...(coverUrl ? { cover_url: coverUrl } : {}) }, tok)).id;
  } else fail(400, 'bad_format');
  // imagem fica pronta em segundos; vídeo pode levar mais que uma requisição aguenta
  const ready = await waitReady(env, creation, tok, format === 'reel' ? 20000 : 15000);
  if (!ready) return { pending: true, creation_id: creation };
  const pub = await post(env, `${me}/media_publish`, { creation_id: creation }, tok);
  const media = await igFetch(`${GRAPH(env)}/${pub.id}?fields=permalink&access_token=${encodeURIComponent(tok)}`).catch(() => ({}));
  return { media_id: pub.id, permalink: media.permalink || null };
}

export async function finishPending(env, acc, creationId) {
  const ready = await waitReady(env, creationId, acc.access_token, 20000);
  if (!ready) return { pending: true, creation_id: creationId };
  const pub = await post(env, `${acc.ig_user_id}/media_publish`, { creation_id: creationId }, acc.access_token);
  const media = await igFetch(`${GRAPH(env)}/${pub.id}?fields=permalink&access_token=${encodeURIComponent(acc.access_token)}`).catch(() => ({}));
  return { media_id: pub.id, permalink: media.permalink || null };
}

// Posts recentes da conta conectada (fotos e capas de vídeo) para usar como foto de produto.
export async function recentMedia(env, acc, limit = 18) {
  const d = await igFetch(`${GRAPH(env)}/me/media?fields=id,media_type,media_url,thumbnail_url,caption,permalink,timestamp&limit=${limit}&access_token=${encodeURIComponent(acc.access_token)}`);
  return (d.data || []).map(m => ({ id: m.id, type: m.media_type, image: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url, caption: (m.caption || '').slice(0, 300), permalink: m.permalink, at: m.timestamp })).filter(m => m.image);
}
export async function mediaById(env, acc, id) {
  return igFetch(`${GRAPH(env)}/${encodeURIComponent(id)}?fields=id,media_type,media_url,thumbnail_url,caption&access_token=${encodeURIComponent(acc.access_token)}`);
}

// ---------- métricas da semana por etapa do funil ----------
// Reels = topo (atrair), carrossel = meio (convencer), foto/vídeo no feed = fundo (vender).
export const stageOf = m => m.media_product_type === 'REELS' ? 'reel' : m.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : 'feed';
const METRICS = { reel: 'reach,views,likes,comments,saved,shares,total_interactions', carousel: 'reach,views,likes,comments,saved,shares,total_interactions,profile_visits', feed: 'reach,views,likes,comments,saved,shares,total_interactions,profile_visits' };

export async function weekMedia(env, acc, since) {
  const d = await igFetch(`${GRAPH(env)}/me/media?fields=id,media_type,media_product_type,timestamp,permalink,thumbnail_url,media_url,caption&since=${Math.floor(since.getTime() / 1000)}&limit=50&access_token=${encodeURIComponent(acc.access_token)}`);
  const list = (d.data || []).filter(m => m.media_product_type !== 'STORY' && new Date(m.timestamp) >= since);
  const withIns = await Promise.all(list.map(async m => {
    const stage = stageOf(m);
    try {
      const r = await fetch(`${GRAPH(env)}/${m.id}/insights?metric=${METRICS[stage]}&access_token=${encodeURIComponent(acc.access_token)}`, { signal: AbortSignal.timeout(15000) });
      const j = await r.json();
      const ins = Object.fromEntries((j.data || []).map(x => [x.name, x.values?.[0]?.value ?? x.total_value?.value ?? 0]));
      return { ...m, stage, ins };
    } catch { return { ...m, stage, ins: {} }; }
  }));
  return withIns;
}

// Soma por etapa. Função pura: testável sem rede.
export function aggregateWeek(media) {
  const zero = () => ({ posts: 0, reach: 0, views: 0, likes: 0, comments: 0, saved: 0, shares: 0, interactions: 0, profile_visits: 0 });
  const stages = { reel: zero(), carousel: zero(), feed: zero() }, total = zero();
  for (const m of media) {
    const i = m.ins || {}, s = stages[m.stage] || stages.feed;
    const inter = i.total_interactions ?? ((i.likes || 0) + (i.comments || 0) + (i.saved || 0) + (i.shares || 0));
    for (const t of [s, total]) {
      t.posts++; t.reach += i.reach || 0; t.views += i.views || 0; t.likes += i.likes || 0; t.comments += i.comments || 0;
      t.saved += i.saved || 0; t.shares += i.shares || 0; t.interactions += inter || 0; t.profile_visits += i.profile_visits || 0;
    }
  }
  const rate = t => t.reach ? Math.round(t.interactions / t.reach * 1000) / 10 : null;
  Object.values(stages).forEach(t => t.engagement = rate(t)); total.engagement = rate(total);
  const top = [...media].sort((a, b) => ((b.ins?.total_interactions || 0) - (a.ins?.total_interactions || 0)) || ((b.ins?.reach || 0) - (a.ins?.reach || 0)))[0] || null;
  return { stages, total, top: top && { id: top.id, stage: top.stage, permalink: top.permalink, image: top.thumbnail_url || top.media_url, reach: top.ins?.reach || 0, interactions: top.ins?.total_interactions || 0, caption: (top.caption || '').slice(0, 80) } };
}
