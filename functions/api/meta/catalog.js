// GET: lista os produtos da sacolinha. POST {ids}: importa os escolhidos como produtos da marca (sem duplicar).
import { json, readJson, fail, id, now } from '../../../lib/util.js';
import { requireUser } from '../../../lib/auth.js';
import { getBrand, one, run } from '../../../lib/db.js';
import { metaAccountFor, catalogProducts } from '../../../lib/meta.js';

export async function onRequestGet({ env, data }) {
  const u = requireUser(data);
  const acc = await metaAccountFor(env, u.id);
  if (!acc) fail(400, 'meta_not_connected', 'Conecte a sacolinha primeiro.');
  return json({ ok: true, catalog: acc.catalog_name, products: await catalogProducts(env, acc) });
}
export async function onRequestPost({ request, env, data }) {
  const u = requireUser(data);
  const brand = await getBrand(env, u.id); if (!brand) fail(400, 'no_brand', 'Cadastre a marca primeiro.');
  const acc = await metaAccountFor(env, u.id); if (!acc) fail(400, 'meta_not_connected', 'Conecte a sacolinha primeiro.');
  const { ids = [] } = await readJson(request);
  const all = await catalogProducts(env, acc, 100), pick = all.filter(p => ids.includes(p.id)).slice(0, 50);
  let added = 0;
  for (const p of pick) {
    if (await one(env, 'SELECT id FROM products WHERE brand_id = ? AND image_url = ?', brand.id, p.image_url)) continue;
    await run(env, 'INSERT INTO products (id,brand_id,name,price,description,image_url,image_key,source,created_at) VALUES (?,?,?,?,?,?,?,?,?)', id('p_'), brand.id, p.name, p.price, null, p.image_url, null, 'sacolinha', now());
    added++;
  }
  return json({ ok: true, added });
}
