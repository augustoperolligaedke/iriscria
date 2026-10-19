// Exclusão da conta pela própria pessoa (Configurações > Excluir minha conta).
// Apaga marca, produtos, conteúdos, arquivos, conexões com Instagram e Facebook, sessões e o usuário.
// Pagamentos ficam guardados sem vínculo de e-mail, pelo prazo que a lei fiscal exige.
import { json } from '../../../lib/util.js';
import { requireUser, clearCookie } from '../../../lib/auth.js';
import { all, run } from '../../../lib/db.js';

export async function onRequestDelete({ env, data }) {
  const u = requireUser(data);
  const brands = await all(env, 'SELECT id FROM brands WHERE user_id = ?', u.id);
  const keys = [];
  for (const b of brands) (await all(env, 'SELECT image_key FROM products WHERE brand_id = ?', b.id)).forEach(r => r.image_key && keys.push(r.image_key));
  (await all(env, 'SELECT output_key FROM contents WHERE user_id = ?', u.id)).forEach(r => r.output_key && keys.push(r.output_key));
  if (env.MEDIA && keys.length) for (let i = 0; i < keys.length; i += 500) await env.MEDIA.delete(keys.slice(i, i + 500)).catch(e => console.error('r2 delete', e));
  for (const b of brands) await run(env, 'DELETE FROM products WHERE brand_id = ?', b.id);
  for (const t of ['contents', 'brands', 'usage', 'wa_links', 'wa_codes', 'instagram_accounts', 'ig_insights_cache', 'meta_accounts', 'sessions'])
    await run(env, `DELETE FROM ${t} WHERE user_id = ?`, u.id);
  await run(env, 'DELETE FROM otp_codes WHERE email = ?', u.email);
  await run(env, 'DELETE FROM users WHERE id = ?', u.id);
  return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
}
