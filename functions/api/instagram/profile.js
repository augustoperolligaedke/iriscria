import { json, fail } from '../../../lib/util.js';
import { requireUser } from '../../../lib/auth.js';
import { accountFor, profileFor } from '../../../lib/instagram.js';

export async function onRequestGet({ env, data }) {
  const u = requireUser(data);
  const acc = await accountFor(env, u.id);
  if (!acc || acc.expired) fail(400, 'ig_not_connected', 'Conecte seu Instagram.');
  return json({ ok: true, profile: await profileFor(env, acc) });
}
