import { json } from '../../../lib/util.js';
import { requireUser } from '../../../lib/auth.js';
import { run } from '../../../lib/db.js';

export async function onRequestDelete({ env, data }) {
  const u = requireUser(data);
  await run(env, 'DELETE FROM instagram_accounts WHERE user_id = ?', u.id);
  return json({ ok: true });
}
