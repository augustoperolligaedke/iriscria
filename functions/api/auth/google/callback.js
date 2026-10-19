// Retorno do Google: valida o state, troca o código, exige e-mail verificado e cria a sessão (mesma do login por código).
import { findOrCreateUser, createSession, sessionCookie } from '../../../../lib/auth.js';
import { normalizeEmail } from '../../../../lib/util.js';

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const state = u.searchParams.get('state') || '';
  const back = state.endsWith('.start') ? 'start' : 'login';
  const cookie = (request.headers.get('cookie') || '').match(/(?:^|;\s*)g_state=([A-Za-z0-9.]+)/)?.[1];
  const go = (q, extra = []) => {
    const h = new Headers({ location: `${env.APP_URL}/app/#/${back}?google=${q}` });
    h.append('set-cookie', 'g_state=; Path=/api/auth/google; Max-Age=0');
    extra.forEach(c => h.append('set-cookie', c));
    return new Response(null, { status: 302, headers: h });
  };
  if (u.searchParams.get('error')) return go('cancelado');
  if (!cookie || cookie !== state) return go('invalido');
  try {
    const tok = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', signal: AbortSignal.timeout(15000), body: new URLSearchParams({ code: u.searchParams.get('code') || '', client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: `${env.APP_URL}/api/auth/google/callback`, grant_type: 'authorization_code' }) }).then(r => r.json());
    if (!tok.access_token) { console.error('google token', JSON.stringify(tok).slice(0, 200)); return go('erro'); }
    const info = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: 'Bearer ' + tok.access_token }, signal: AbortSignal.timeout(15000) }).then(r => r.json());
    if (!info.email || info.email_verified !== true) return go('sem_email');
    const user = await findOrCreateUser(env, normalizeEmail(info.email));
    const token = await createSession(env, user.id);
    return go('ok', [sessionCookie(token, request)]);
  } catch (e) { console.error('google callback', e); return go('erro'); }
}
