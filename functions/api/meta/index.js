import { json } from '../../../lib/util.js';
import { requireUser } from '../../../lib/auth.js';
import { run } from '../../../lib/db.js';

// Desconecta a sacolinha (apaga o token do Facebook guardado).
export async function onRequestDelete({ env, data }) {
  const u = requireUser(data);
  await run(env, 'DELETE FROM meta_accounts WHERE user_id = ?', u.id);
  return json({ ok: true });
}
