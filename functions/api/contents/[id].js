import { json, readJson, fail, now } from '../../../lib/util.js';
import { requireUser } from '../../../lib/auth.js';
import { one, run, parseContent } from '../../../lib/db.js';
import { refreshContent } from '../../../lib/generate.js';

async function load(env, u, id) {
  const c = parseContent(await one(env, 'SELECT * FROM contents WHERE id = ? AND user_id = ?', id, u.id));
  if (!c) fail(404, 'not_found');
  return c;
}
export async function onRequestGet({ env, data, params }) {
  const u = requireUser(data);
  let c = await load(env, u, params.id);
  c = await refreshContent(env, c);
  return json({ ok: true, content: c });
}
export async function onRequestPatch({ request, env, data, params }) {
  const u = requireUser(data);
  const c = await load(env, u, params.id);
  const b = await readJson(request);
  const spec = c.spec;
  if (b.copy && typeof b.copy === 'object') spec.copy = { ...spec.copy, ...b.copy };
  let status = c.status;
  if (b.action === 'approve' && ['completed'].includes(c.status)) status = 'approved';
  if (b.action === 'unapprove' && c.status === 'approved') status = 'completed';
  await run(env, 'UPDATE contents SET spec = ?, status = ?, updated_at = ? WHERE id = ?', JSON.stringify(spec), status, now(), c.id);
  return json({ ok: true, content: await load(env, u, c.id) });
}
export async function onRequestDelete({ env, data, params }) {
  const u = requireUser(data);
  await load(env, u, params.id);
  await run(env, 'DELETE FROM contents WHERE id = ?', params.id);
  return json({ ok: true });
}
