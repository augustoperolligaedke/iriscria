import { json, readJson, normalizeEmail, isEmail, fail } from '../../../lib/util.js';
import { verifyOtp, findOrCreateUser, createSession, sessionCookie } from '../../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  const { email: raw, code } = await readJson(request);
  const email = normalizeEmail(raw);
  if (!isEmail(email)) fail(400, 'invalid_email');
  await verifyOtp(env, email, code);
  const user = await findOrCreateUser(env, email);
  const token = await createSession(env, user.id);
  return json({ ok: true, user: { id: user.id, email: user.email, plan: user.plan } }, 200, { 'set-cookie': sessionCookie(token, request) });
}
