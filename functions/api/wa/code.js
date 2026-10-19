import { json, now } from '../../../lib/util.js';
import { requireUser } from '../../../lib/auth.js';
import { run } from '../../../lib/db.js';

export async function onRequestPost({ env, data }) {
  const u = requireUser(data);
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  await run(env, 'DELETE FROM wa_codes WHERE user_id = ? OR expires_at < ?', u.id, now());
  await run(env, 'INSERT INTO wa_codes (code, user_id, expires_at) VALUES (?,?,?)', code, u.id, new Date(Date.now() + 30 * 60e3).toISOString());
  return json({ ok: true, code, phone: env.TYXTER_SENDER_PHONE || null, text: `iris ${code}` });
}
