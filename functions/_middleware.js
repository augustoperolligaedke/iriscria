import { HttpError, json } from '../lib/util.js';
import { userFromRequest } from '../lib/auth.js';

export async function onRequest({ request, env, data, next }) {
  const url = new URL(request.url);
  // só local: links de mídia e redirecionamentos seguem o endereço usado (localhost ou IP da rede, para testar no celular)
  if (env.DEV_SHOW_CODE === '1') env.APP_URL = url.origin;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/media/')) {
    try {
      data.user = await userFromRequest(env, request);
      return await next();
    } catch (e) {
      if (e instanceof HttpError) return json({ ok: false, error: e.code, message: e.message }, e.status);
      console.error(e);
      return json({ ok: false, error: 'internal', message: 'Algo deu errado do nosso lado. Tente de novo.' }, 500);
    }
  }
  return next();
}
