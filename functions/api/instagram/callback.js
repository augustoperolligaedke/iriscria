// Retorno do login do Instagram: valida o state e salva a conta. No onboarding, sem sessão, entra ou cria a conta pelo Instagram.
import { exchangeCode, saveAccount } from '../../../lib/instagram.js';
import { findOrCreateIgUser, createSession, sessionCookie } from '../../../lib/auth.js';

export async function onRequestGet({ request, env, data }) {
  const u = new URL(request.url);
  const state = u.searchParams.get('state') || '';
  const back = state.endsWith('.start') ? 'start' : 'conta';
  const cookie = (request.headers.get('cookie') || '').match(/(?:^|;\s*)ig_state=([A-Za-z0-9.]+)/)?.[1];
  const go = (q, extra = []) => { const h = new Headers({ location: `${env.APP_URL}/app/#/${back}?ig=${q}` }); h.append('set-cookie', 'ig_state=; Path=/api/instagram; Max-Age=0'); extra.forEach(c => h.append('set-cookie', c)); return new Response(null, { status: 302, headers: h }); };
  if (u.searchParams.get('error')) return go('cancelado');
  if (!cookie || cookie !== state) return go('invalido');
  if (!data.user && back !== 'start') return go('sessao');
  try {
    const x = await exchangeCode(env, u.searchParams.get('code') || '');
    let user = data.user, cookies = [];
    if (!user) { user = await findOrCreateIgUser(env, x.igId); cookies = [sessionCookie(await createSession(env, user.id), request)]; }
    await saveAccount(env, user.id, x);
    return go('ok', cookies);
  } catch (e) { console.error('ig callback', e); return go('erro'); }
}
