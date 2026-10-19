import { json, fail } from '../../../lib/util.js';
import { requireUser } from '../../../lib/auth.js';
import { accountFor, recentMedia } from '../../../lib/instagram.js';

export async function onRequestGet({ env, data }) {
  const u = requireUser(data);
  const acc = await accountFor(env, u.id);
  if (!acc || acc.expired) fail(400, 'ig_not_connected', 'Conecte seu Instagram para usar seus posts.');
  return json({ ok: true, media: await recentMedia(env, acc) });
}
