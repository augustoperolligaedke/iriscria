// Retorno do login do Instagram: valida o state, troca o código por token longo e salva a conta.
import { connectAccount } from '../../../lib/instagram.js';

export async function onRequestGet({ request, env, data }) {
  const u = new URL(request.url);
  const state = u.searchParams.get('state') || '';
  const back = state.endsWith('.start') ? 'start' : 'conta';
  const cookie = (request.headers.get('cookie') || '').match(/(?:^|;\s*)ig_state=([A-Za-z0-9.]+)/)?.[1];
  const go = q => new Response(null, { status: 302, headers: { location: `${env.APP_URL}/app/#/${back}?ig=${q}`, 'set-cookie': 'ig_state=; Path=/api/instagram; Max-Age=0' } });
  if (u.searchParams.get('error')) return go('cancelado');
  if (!data.user) return go('sessao');
  if (!cookie || cookie !== state) return go('invalido');
  try { await connectAccount(env, data.user.id, u.searchParams.get('code') || ''); return go('ok'); }
  catch (e) { console.error('ig callback', e); return go('erro'); }
}
