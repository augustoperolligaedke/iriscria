// Abre o login do Instagram. Guarda um state aleatório em cookie para validar o retorno.
import { requireUser } from '../../../lib/auth.js';
import { igEnabled, authorizeUrl } from '../../../lib/instagram.js';

export async function onRequestGet({ request, env, data }) {
  const back = new URL(request.url).searchParams.get('back') === 'start' ? 'start' : 'conta';
  // no onboarding, conectar o Instagram também cria a conta; fora dele, precisa estar logado
  if (back !== 'start') requireUser(data);
  if (!igEnabled(env)) return Response.redirect(`${env.APP_URL}/app/#/${back}?ig=off`, 302); // falta IG_APP_ID/IG_APP_SECRET (app da Meta)
  const state = crypto.randomUUID().replace(/-/g, '') + '.' + back;
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return new Response(null, { status: 302, headers: { location: authorizeUrl(env, state), 'set-cookie': `ig_state=${state}; Path=/api/instagram; HttpOnly; SameSite=Lax; Max-Age=600${secure}` } });
}
