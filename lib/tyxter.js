// Tyxter: WhatsApp Business Platform. Envio de mensagens e verificação do webhook.
import { hmacHex, hmacBase64, safeEqual } from './util.js';

export const waEnabled = env => !!(env.TYXTER_API_KEY && env.TYXTER_SENDER_ID);

async function send(env, message, to) {
  const r = await fetch('https://api.tyxter.com/v1/messages', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + env.TYXTER_API_KEY, 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
    body: JSON.stringify({ sender: { type: 'whatsapp_phone_number', id: env.TYXTER_SENDER_ID }, recipient: { type: 'phone_e164', id: to }, channel: 'whatsapp', message }),
  });
  if (!r.ok) { console.error('tyxter', r.status, await r.text()); return null; }
  return r.json();
}
export const sendText = (env, to, body) => send(env, { type: 'text', text: { body } }, to);
export const sendImage = (env, to, link, caption) => send(env, { type: 'media', media: { kind: 'image', link, caption } }, to);

export async function verifyWebhook(env, request, rawBody) {
  const id = request.headers.get('tyxter-webhook-id'), ts = request.headers.get('tyxter-webhook-timestamp'), sig = request.headers.get('tyxter-webhook-signature');
  if (!id || !ts || !sig || !env.TYXTER_WEBHOOK_SECRET) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const signed = `${ts}.${rawBody}`;
  const hex = await hmacHex(env.TYXTER_WEBHOOK_SECRET, signed), b64 = await hmacBase64(env.TYXTER_WEBHOOK_SECRET, signed);
  return sig.split(/[ ,]/).some(part => { const v = part.replace(/^v1[=,]/, ''); return safeEqual(v, hex) || safeEqual(v, b64); });
}

export async function downloadMedia(env, path) {
  const r = await fetch('https://api.tyxter.com' + path, { headers: { authorization: 'Bearer ' + env.TYXTER_API_KEY } });
  if (!r.ok) return null;
  const d = await r.json().catch(() => null);
  const url = d?.url || d?.download_url; if (!url) return null;
  const f = await fetch(url); if (!f.ok) return null;
  return { bytes: await f.arrayBuffer(), contentType: f.headers.get('content-type') || 'image/jpeg' };
}
