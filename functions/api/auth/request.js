import { json, readJson, normalizeEmail, isEmail, fail } from '../../../lib/util.js';
import { createOtp } from '../../../lib/auth.js';
import { sendOtpEmail } from '../../../lib/mailer.js';

export async function onRequestPost({ request, env }) {
  const { email: raw } = await readJson(request);
  const email = normalizeEmail(raw);
  if (!isEmail(email)) fail(400, 'invalid_email', 'Digite um e-mail válido.');
  const code = await createOtp(env, email);
  const { sent } = await sendOtpEmail(env, email, code);
  const body = { ok: true, sent };
  if (!sent && env.DEV_SHOW_CODE === '1') body.dev_code = code;
  return json(body);
}
