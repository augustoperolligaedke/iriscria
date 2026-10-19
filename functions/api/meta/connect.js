// Abre o login do Facebook para importar a sacolinha. Precisa estar logado na Íris.
import { requireUser } from '../../../lib/auth.js';
import { metaEnabled, metaAuthorizeUrl } from '../../../lib/meta.js';

export async function onRequestGet({ request, env, data }) {
  requireUser(data);
  const back = new URL(request.url).searchParams.get('back') === 'start' ? 'start' : 'conta';
  if (!metaEnabled(env)) return Response.redirect(`${env.APP_URL}/app/#/${back}?sacolinha=off`, 302);
  const state = crypto.randomUUID().replace(/-/g, '') + '.' + back;
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return new Response(null, { status: 302, headers: { location: metaAuthorizeUrl(env, state), 'set-cookie': `meta_state=${state}; Path=/api/meta; HttpOnly; SameSite=Lax; Max-Age=600${secure}` } });
}
