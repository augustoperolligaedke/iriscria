// "Entrar com Google": abre o consentimento do Google. O state vai num cookie para validar o retorno.
export async function onRequestGet({ request, env }) {
  const back = new URL(request.url).searchParams.get('back') === 'start' ? 'start' : 'login';
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return Response.redirect(`${env.APP_URL}/app/#/${back}?google=off`, 302);
  const state = crypto.randomUUID().replace(/-/g, '') + '.' + back;
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: `${env.APP_URL}/api/auth/google/callback`, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account', access_type: 'online' });
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return new Response(null, { status: 302, headers: { location: u.href, 'set-cookie': `g_state=${state}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=600${secure}` } });
}
