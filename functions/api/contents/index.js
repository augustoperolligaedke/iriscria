import { json, readJson, fail, clean } from '../../../lib/util.js';
import { requireUser } from '../../../lib/auth.js';
import { getBrand, parseBrand, parseContent, all, one } from '../../../lib/db.js';
import { createContent } from '../../../lib/generate.js';

export async function onRequestGet({ env, data }) {
  const u = requireUser(data);
  const rows = await all(env, 'SELECT * FROM contents WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', u.id);
  return json({ ok: true, contents: rows.map(parseContent) });
}
export async function onRequestPost({ request, env, data }) {
  const u = requireUser(data);
  const body = await readJson(request);
  const brand = parseBrand(await getBrand(env, u.id));
  if (!brand) fail(400, 'no_brand', 'Cadastre a marca primeiro.');
  const product = await one(env, 'SELECT * FROM products WHERE id = ? AND brand_id = ?', body.product_id, brand.id);
  if (!product) fail(404, 'no_product', 'Produto não encontrado.');
  const formats = Array.isArray(body.formats) ? body.formats : [body.format];
  const out = [];
  for (const f of formats) out.push(await createContent(env, u, brand, product, { format: f, offer: clean(body.offer, 160), gift: !!body.gift }));
  return json({ ok: true, contents: out });
}
