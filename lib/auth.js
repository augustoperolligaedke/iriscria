import { now, id, sha256, fail, normalizeEmail } from './util.js';
import { one, run } from './db.js';

const COOKIE = 'iris_session';
const DAYS = 30;

export function sessionCookie(token, request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DAYS * 86400}${secure}`;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export async function userFromRequest(env, request) {
  const m = (request.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([A-Za-z0-9_-]+)'));
  if (!m) return null;
  const s = await one(env, 'SELECT user_id, expires_at FROM sessions WHERE token = ?', m[1]);
  if (!s || s.expires_at < now()) return null;
  return one(env, 'SELECT * FROM users WHERE id = ?', s.user_id);
}
export const requireUser = data => data.user || fail(401, 'unauthorized', 'Entre para continuar.');

export async function createOtp(env, email) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 10 * 60e3).toISOString();
  await run(env, 'DELETE FROM otp_codes WHERE email = ? OR expires_at < ?', email, now());
  await run(env, 'INSERT INTO otp_codes (email, code_hash, expires_at) VALUES (?,?,?)', email, await sha256(email + ':' + code), expires);
  return code;
}
export async function verifyOtp(env, email, code) {
  const row = await one(env, 'SELECT * FROM otp_codes WHERE email = ? ORDER BY expires_at DESC LIMIT 1', email);
  if (!row || row.expires_at < now()) fail(400, 'code_expired', 'Código expirado. Peça um novo.');
  if (row.attempts >= 5) fail(429, 'too_many', 'Muitas tentativas. Peça um novo código.');
  if (row.code_hash !== await sha256(email + ':' + String(code).trim())) {
    await run(env, 'UPDATE otp_codes SET attempts = attempts + 1 WHERE email = ? AND code_hash = ?', email, row.code_hash);
    fail(400, 'code_invalid', 'Código incorreto.');
  }
  await run(env, 'DELETE FROM otp_codes WHERE email = ?', email);
}
export async function findOrCreateUser(env, emailRaw) {
  const email = normalizeEmail(emailRaw);
  let u = await one(env, 'SELECT * FROM users WHERE email = ?', email);
  if (!u) {
    const uid = id('u_');
    await run(env, 'INSERT INTO users (id, email, created_at) VALUES (?,?,?)', uid, email, now());
    u = await one(env, 'SELECT * FROM users WHERE id = ?', uid);
  }
  return u;
}
export async function createSession(env, userId) {
  const token = id('s_') + id('');
  await run(env, 'INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)', token, userId, new Date(Date.now() + DAYS * 86400e3).toISOString());
  return token;
}

// Conta criada pelo Instagram: o login do Instagram não informa e-mail. O e-mail provisório nunca recebe mensagem.
export const IG_EMAIL_DOMAIN = 'ig.iriscria.invalid';
export const isPlaceholderEmail = e => String(e || '').endsWith('@' + IG_EMAIL_DOMAIN);
export async function findOrCreateIgUser(env, igId) {
  const acc = await one(env, 'SELECT user_id FROM instagram_accounts WHERE ig_user_id = ?', String(igId));
  if (acc) return one(env, 'SELECT * FROM users WHERE id = ?', acc.user_id);
  const uid = id('u_');
  await run(env, 'INSERT INTO users (id, email, created_at) VALUES (?,?,?)', uid, `ig-${String(igId).replace(/\D/g, '')}@${IG_EMAIL_DOMAIN}`, now());
  return one(env, 'SELECT * FROM users WHERE id = ?', uid);
}
