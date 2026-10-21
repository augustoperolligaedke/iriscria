import { json, readJson, normalizeEmail, isEmail, fail } from '../../../lib/util.js';
import { createOtp } from '../../../lib/auth.js';
import { sendOtpEmail } from '../../../lib/mailer.js';

export async function onRequestPost({ request, env }) {
  const { email: raw } = await readJson(request);
  const email = normalizeEmail(raw);
  if (!isEmail(email)) fail(400, 'invalid_email', 'Digite um e-mail válido.');
  // sem RESEND_API_KEY o código nunca chegaria: em produção, avisa e manda entrar com o Google
  if (!env.RESEND_API_KEY && env.DEV_SHOW_CODE !== '1') fail(503, 'mail_unavailable', 'O código por e-mail ainda não está ativo. Entre com o Google.');
  const code = await createOtp(env, email);
  const { sent } = await sendOtpEmail(env, email, code);
  const body = { ok: true, sent };
  if (!sent && env.DEV_SHOW_CODE === '1') body.dev_code = code;
  return json(body);
}
