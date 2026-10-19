import { json, readJson, clean, id, now, fail } from '../../../lib/util.js';
import { requireUser } from '../../../lib/auth.js';
import { getBrand, all, run, one } from '../../../lib/db.js';

export async function onRequestGet({ env, data }) {
  const u = requireUser(data); const brand = await getBrand(env, u.id);
  return json({ ok: true, products: brand ? await all(env, 'SELECT * FROM products WHERE brand_id = ? ORDER BY created_at DESC', brand.id) : [] });
}
export async function onRequestPost({ request, env, data }) {
  const u = requireUser(data); const brand = await getBrand(env, u.id);
  if (!brand) fail(400, 'no_brand', 'Cadastre a marca primeiro.');
  const p = await readJson(request);
  const name = clean(p.name, 120) || 'Produto';
  const image_url = clean(p.image_url, 600) || null, image_key = clean(p.image_key, 200) || null;
  if (!image_url && !image_key) fail(400, 'no_image', 'Escolha ou envie uma foto do produto.');
  const pid = id('p_');
  await run(env, 'INSERT INTO products (id,brand_id,name,price,description,image_url,image_key,source,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    pid, brand.id, name, clean(p.price, 40) || null, clean(p.description, 600) || null, image_url || `${env.APP_URL}/media/${image_key}`, image_key, clean(p.source, 20) || 'manual', now());
  return json({ ok: true, product: await one(env, 'SELECT * FROM products WHERE id = ?', pid) });
}
