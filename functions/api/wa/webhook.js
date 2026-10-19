// Webhook do Tyxter: vincula telefone à conta ("Íris CODIGO") e recebe fotos de produto.
import { json, now, id, clean } from '../../../lib/util.js';
import { one, run, getBrand } from '../../../lib/db.js';
import { verifyWebhook, sendText, downloadMedia } from '../../../lib/tyxter.js';

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  if (!(await verifyWebhook(env, request, raw))) return json({ ok: false, error: 'bad_signature' }, 401);
  const ev = JSON.parse(raw);
  if (ev.type !== 'message.received') return json({ ok: true, ignored: ev.type });
  const d = ev.data || {}, from = d.sender?.id, content = d.content || {};
  if (!from) return json({ ok: true });
  const text = clean(content.text?.body || content.text || content.body || '', 500);
  const link = await one(env, 'SELECT user_id FROM wa_links WHERE phone = ?', from);

  const m = /^Íris\s+([a-z0-9]{6})$/i.exec(text);
  if (m) {
    const c = await one(env, 'SELECT user_id FROM wa_codes WHERE code = ? AND expires_at > ?', m[1].toUpperCase(), now());
    if (!c) { await sendText(env, from, 'Esse código expirou. Gere outro em Conta no app da Íris.'); return json({ ok: true }); }
    await run(env, 'INSERT INTO wa_links (phone, user_id, created_at) VALUES (?,?,?) ON CONFLICT(phone) DO UPDATE SET user_id = excluded.user_id', from, c.user_id, now());
    await run(env, 'UPDATE users SET phone = ? WHERE id = ?', from, c.user_id);
    await run(env, 'DELETE FROM wa_codes WHERE code = ?', m[1].toUpperCase());
    await sendText(env, from, 'Pronto, WhatsApp conectado. Me manda a foto de um produto com o nome e o preço na legenda que eu preparo o post.');
    return json({ ok: true });
  }
  if (!link) { await sendText(env, from, `Oi! Sou a Íris. Para conectar este número, abra ${env.APP_URL}/app/#/conta e me mande o código que aparece lá.`); return json({ ok: true }); }

  const media = content.media || d.media;
  if (media && (media.kind === 'image' || /^image\//.test(media.mime_type || '')) && media.download?.path) {
    const brand = await getBrand(env, link.user_id);
    if (!brand) { await sendText(env, from, `Antes, termine o cadastro da marca em ${env.APP_URL}/app`); return json({ ok: true }); }
    const file = await downloadMedia(env, media.download.path);
    if (!file) { await sendText(env, from, 'Não consegui baixar a foto. Tenta mandar de novo?'); return json({ ok: true }); }
    const key = `u/${link.user_id}/${id('m_')}.jpg`;
    await env.MEDIA.put(key, file.bytes, { httpMetadata: { contentType: file.contentType } });
    const caption = clean(media.caption || content.caption || text, 200);
    const price = /R\$\s?[\d.,]+/.exec(caption)?.[0] || null;
    const name = caption.replace(/R\$\s?[\d.,]+/, '').trim() || 'Produto do WhatsApp';
    const pid = id('p_');
    await run(env, 'INSERT INTO products (id,brand_id,name,price,description,image_url,image_key,source,created_at) VALUES (?,?,?,?,?,?,?,?,?)', pid, brand.id, name, price, null, `${env.APP_URL}/media/${key}`, key, 'whatsapp', now());
    await sendText(env, from, `Recebi "${name}"${price ? ' por ' + price : ''}. Escolhe o formato e aprova aqui: ${env.APP_URL}/app/#/create?product=${pid}`);
    return json({ ok: true });
  }
  await sendText(env, from, 'Me manda a foto do produto com nome e preço na legenda que eu preparo o post. Para ver tudo: ' + env.APP_URL + '/app');
  return json({ ok: true });
}
