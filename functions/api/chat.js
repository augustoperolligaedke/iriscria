// "Íris, cria…": pedido em texto + foto (celular, Instagram ou produto salvo) → conteúdos gerados.
import { json, readJson, fail, clean, id, now } from '../../lib/util.js';
import { requireUser } from '../../lib/auth.js';
import { getBrand, parseBrand, one, run } from '../../lib/db.js';
import { createContent, copyToR2 } from '../../lib/generate.js';
import { parseIntent } from '../../lib/intent.js';
import { accountFor, mediaById } from '../../lib/instagram.js';
import { FUNNEL } from '../../lib/playbook.js';

export async function onRequestPost({ request, env, data }) {
  const u = requireUser(data);
  const brand = parseBrand(await getBrand(env, u.id));
  if (!brand) fail(400, 'no_brand', 'Cadastre a marca primeiro.');
  const b = await readJson(request);
  const text = clean(b.text, 600);
  const intent = await parseIntent(env, text);

  // de onde vem a foto do produto
  let product = null;
  const own = url => typeof url === 'string' && url.startsWith(`${env.APP_URL}/media/u/${u.id}/`);
  if (b.product_id) product = await one(env, 'SELECT * FROM products WHERE id = ? AND brand_id = ?', b.product_id, brand.id);
  else if (b.upload?.key && own(b.upload.url)) product = await newProduct(env, brand, intent, b.upload.url, b.upload.key, 'upload');
  else if (b.ig_media_id) {
    const acc = await accountFor(env, u.id);
    if (!acc || acc.expired) fail(400, 'ig_not_connected', 'Conecte seu Instagram para usar seus posts.');
    const m = await mediaById(env, acc, b.ig_media_id);
    const src = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url;
    if (!src) fail(400, 'ig_no_image', 'Esse post não tem imagem que eu consiga usar.');
    // a URL do Instagram expira: copia para o nosso armazenamento
    const key = env.MEDIA ? await copyToR2(env, src, u.id, 'jpg', 'image/jpeg') : null;
    const fromCaption = !intent.product_name && m.caption ? clean(m.caption.split(/\n|[.!?]/)[0].replace(/[#@]\S+/g, ''), 60) : null;
    product = await newProduct(env, brand, { ...intent, product_name: intent.product_name || fromCaption, price: intent.price || ((m.caption || '').match(/r\$\s?\d+(?:[.,]\d{2})?/i) || [])[0] || null }, key ? `${env.APP_URL}/media/${key}` : src, key, 'instagram');
  } else {
    // sem foto: procura o produto citado no texto, senão o mais recente
    if (intent.product_name) product = await one(env, 'SELECT * FROM products WHERE brand_id = ? AND lower(name) LIKE ? ORDER BY created_at DESC LIMIT 1', brand.id, '%' + intent.product_name.toLowerCase().slice(0, 30) + '%');
    product ||= await one(env, 'SELECT * FROM products WHERE brand_id = ? ORDER BY created_at DESC LIMIT 1', brand.id);
  }
  if (!product) fail(400, 'need_photo', 'Mande uma foto do produto, do celular ou do seu Instagram, e eu crio.');
  if (intent.price && !product.price) { await run(env, 'UPDATE products SET price = ? WHERE id = ?', intent.price, product.id); product.price = intent.price; }

  const formats = (intent.formats.length ? intent.formats : [b.default_format || 'carousel']).slice(0, 3);
  const out = [], errors = [];
  for (const f of formats) {
    try { out.push(await createContent(env, u, brand, product, { format: f, offer: intent.offer })); }
    catch (e) { errors.push(e.message); }
  }
  if (!out.length) fail(402, 'no_credits', errors[0] || 'Não consegui criar agora.');
  const names = { reel: 'um reels', carousel: 'um carrossel', feed: 'um post no feed' };
  const reply = `Pronto. Criei ${out.map(c => `${names[c.format]} (${FUNNEL[c.format].label.split(' · ')[0].toLowerCase()})`).join(', ')} de ${product.name}${intent.offer ? `, com o gancho de ${intent.offer}` : ''}.${errors.length ? ' ' + errors[0] : ''}`;
  return json({ ok: true, reply, contents: out, product: { id: product.id, name: product.name } });
}

async function newProduct(env, brand, intent, imageUrl, key, source) {
  const pid = id('p_');
  const name = intent.product_name ? intent.product_name.charAt(0).toUpperCase() + intent.product_name.slice(1) : 'Produto novo';
  await run(env, 'INSERT INTO products (id,brand_id,name,price,description,image_url,image_key,source,created_at) VALUES (?,?,?,?,?,?,?,?,?)', pid, brand.id, name, intent.price || null, null, imageUrl, key, source, now());
  return one(env, 'SELECT * FROM products WHERE id = ?', pid);
}
