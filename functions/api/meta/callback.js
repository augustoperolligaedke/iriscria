import { connectMeta } from '../../../lib/meta.js';

export async function onRequestGet({ request, env, data }) {
  const u = new URL(request.url), state = u.searchParams.get('state') || '';
  const back = state.endsWith('.start') ? 'start' : 'conta';
  const cookie = (request.headers.get('cookie') || '').match(/(?:^|;\s*)meta_state=([A-Za-z0-9.]+)/)?.[1];
  const go = q => new Response(null, { status: 302, headers: { location: `${env.APP_URL}/app/#/${back}?sacolinha=${q}`, 'set-cookie': 'meta_state=; Path=/api/meta; Max-Age=0' } });
  if (u.searchParams.get('error')) return go('cancelado');
  if (!data.user) return go('sessao');
  if (!cookie || cookie !== state) return go('invalido');
  try { const r = await connectMeta(env, data.user.id, u.searchParams.get('code') || ''); return go(r.catalog ? 'ok' : 'sem_catalogo'); }
  catch (e) { console.error('meta callback', e); return go(e.code === 'no_ig_business' ? 'sem_conta' : 'erro'); }
}
