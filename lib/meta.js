// Sacolinha do Instagram (catálogo do Instagram Shopping) via login do Facebook.
// A API só expõe o catálogo nesse login: permissões catalog_management, instagram_basic, instagram_shopping_tag_products.
// Pré-requisitos da loja: conta comercial (criador não serve), loja do Instagram aprovada e quem conecta ser admin do gerenciador de negócios.
import { fail, now } from './util.js';
import { one, run } from './db.js';
import { brl } from './catalog.js';

const V = env => env.META_GRAPH_VERSION || 'v23.0';
const G = env => `https://graph.facebook.com/${V(env)}`;
export const metaEnabled = env => !!(env.META_APP_ID && env.META_APP_SECRET);
export const metaRedirect = env => `${env.APP_URL}/api/meta/callback`;
const SCOPES = 'catalog_management,instagram_basic,instagram_shopping_tag_products,pages_show_list,business_management';

export function metaAuthorizeUrl(env, state) {
  const u = new URL(`https://www.facebook.com/${V(env)}/dialog/oauth`);
  u.search = new URLSearchParams({ client_id: env.META_APP_ID, redirect_uri: metaRedirect(env), state, scope: SCOPES, response_type: 'code' });
  return u.href;
}
async function gfetch(url, init) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) { console.error('meta', url.split('?')[0], d.error?.message); fail(502, 'meta_error', 'O Facebook recusou: ' + (d.error?.message || 'erro ' + r.status)); }
  return d;
}
const q = (o) => new URLSearchParams(o).toString();

export async function connectMeta(env, userId, code) {
  const short = await gfetch(`${G(env)}/oauth/access_token?${q({ client_id: env.META_APP_ID, client_secret: env.META_APP_SECRET, redirect_uri: metaRedirect(env), code })}`);
  const long = await gfetch(`${G(env)}/oauth/access_token?${q({ grant_type: 'fb_exchange_token', client_id: env.META_APP_ID, client_secret: env.META_APP_SECRET, fb_exchange_token: short.access_token })}`);
  const tok = long.access_token || short.access_token;
  const me = await gfetch(`${G(env)}/me?fields=id&access_token=${encodeURIComponent(tok)}`);
  // conta comercial do Instagram ligada a alguma página que a pessoa administra
  const pages = await gfetch(`${G(env)}/me/accounts?fields=name,instagram_business_account{id,username}&limit=50&access_token=${encodeURIComponent(tok)}`);
  const igs = (pages.data || []).map(p => p.instagram_business_account).filter(Boolean);
  const ig = igs[0];
  if (!ig) fail(400, 'no_ig_business', 'Não achei uma conta comercial do Instagram ligada às suas páginas do Facebook.');
  const cats = await gfetch(`${G(env)}/${ig.id}/available_catalogs?fields=catalog_id,catalog_name,product_count&access_token=${encodeURIComponent(tok)}`).catch(() => ({ data: [] }));
  const cat = (cats.data || [])[0] || null;
  const exp = long.expires_in ? new Date(Date.now() + long.expires_in * 1000).toISOString() : null;
  await run(env, `INSERT INTO meta_accounts (user_id, fb_user_id, ig_business_id, ig_username, catalog_id, catalog_name, access_token, expires_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET fb_user_id=excluded.fb_user_id, ig_business_id=excluded.ig_business_id, ig_username=excluded.ig_username, catalog_id=excluded.catalog_id, catalog_name=excluded.catalog_name, access_token=excluded.access_token, expires_at=excluded.expires_at, updated_at=excluded.updated_at`,
    userId, me.id, ig.id, ig.username || null, cat?.catalog_id || null, cat?.catalog_name || null, tok, exp, now(), now());
  return { ig: ig.username, catalog: cat?.catalog_name || null, products: cat?.product_count ?? null };
}

export const metaAccountFor = (env, userId) => one(env, 'SELECT * FROM meta_accounts WHERE user_id = ?', userId);

// Produtos da sacolinha com preço (lido do catálogo; a busca de produtos marcáveis não traz preço).
export async function catalogProducts(env, acc, limit = 60) {
  if (!acc?.catalog_id) fail(400, 'no_catalog', 'Sua conta não tem loja do Instagram com catálogo aprovado.');
  const d = await gfetch(`${G(env)}/${acc.catalog_id}/products?fields=id,retailer_id,name,price,sale_price,image_url,availability,url&limit=${limit}&access_token=${encodeURIComponent(acc.access_token)}`);
  return (d.data || []).filter(p => p.image_url && p.name && p.availability !== 'out of stock').map(p => ({
    id: p.id, retailer_id: p.retailer_id, name: String(p.name).slice(0, 80), price: brl(p.sale_price || p.price), image_url: p.image_url, url: p.url || null,
  }));
}
