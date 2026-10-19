import { json, hmacHex, safeEqual, now } from '../../../lib/util.js';
import { run, one } from '../../../lib/db.js';

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  const sig = request.headers.get('stripe-signature') || '';
  const t = /t=(\d+)/.exec(sig)?.[1], v1 = /v1=([a-f0-9]+)/.exec(sig)?.[1];
  if (!env.STRIPE_WEBHOOK_SECRET || !t || !v1) return json({ ok: false }, 400);
  const expected = await hmacHex(env.STRIPE_WEBHOOK_SECRET, `${t}.${raw}`);
  if (!safeEqual(expected, v1)) return json({ ok: false, error: 'bad_signature' }, 400);
  const ev = JSON.parse(raw);
  const obj = ev.data?.object || {};
  const userId = obj.metadata?.user_id, plan = obj.metadata?.plan;
  if (ev.type === 'checkout.session.completed' && userId && plan) {
    await run(env, "UPDATE users SET plan = ?, plan_until = ?, stripe_customer = ?, plan_source = 'card' WHERE id = ?", plan, new Date(Date.now() + 35 * 86400e3).toISOString(), obj.customer || null, userId);
  }
  if (ev.type === 'invoice.paid' && obj.customer) {
    const u = await one(env, 'SELECT id FROM users WHERE stripe_customer = ?', obj.customer);
    if (u) await run(env, 'UPDATE users SET plan_until = ? WHERE id = ?', new Date((obj.lines?.data?.[0]?.period?.end || Date.now() / 1000 + 35 * 86400) * 1000 + 3 * 86400e3).toISOString(), u.id);
  }
  if ((ev.type === 'customer.subscription.deleted') && obj.customer) {
    await run(env, 'UPDATE users SET plan = \'free\', plan_until = NULL WHERE stripe_customer = ?', obj.customer);
  }
  return json({ ok: true });
}
