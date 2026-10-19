// Webhook da AbacatePay. Cadastre a URL como .../api/billing/abacatepay?webhookSecret=<ABACATE_WEBHOOK_SECRET>
import { json, safeEqual } from '../../../lib/util.js';
import { applyPixPayment } from '../../../lib/abacatepay.js';

export async function onRequestPost({ request, env }) {
  const secret = new URL(request.url).searchParams.get('webhookSecret') || '';
  if (!env.ABACATE_WEBHOOK_SECRET || !safeEqual(secret, env.ABACATE_WEBHOOK_SECRET)) return json({ ok: false, error: 'unauthorized' }, 401);
  let ev; try { ev = JSON.parse(await request.text()); } catch { return json({ ok: false }, 400); }
  // v2: checkout.completed; v1 (legado): billing.paid
  if (!['checkout.completed', 'billing.paid'].includes(ev.event)) return json({ ok: true, ignored: ev.event });
  const data = ev.data?.checkout || ev.data?.billing || ev.data || {};
  if (ev.devMode && env.ABACATE_ACCEPT_DEV !== '1') return json({ ok: true, ignored: 'dev_mode' });
  const r = await applyPixPayment(env, data);
  if (!r.ok) console.error('abacatepay webhook', r.reason, JSON.stringify(ev).slice(0, 400));
  return json({ ok: true, ...r });
}
