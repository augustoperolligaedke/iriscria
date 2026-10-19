import { json, readJson, fail } from '../../../lib/util.js';
import { requireUser } from '../../../lib/auth.js';
import { PLANS } from '../../../lib/plans.js';
import { createPixCheckout } from '../../../lib/abacatepay.js';

export async function onRequestPost({ request, env, data }) {
  const u = requireUser(data);
  const { plan, back, method = 'card', period = 'mensal' } = await readJson(request);
  if (!PLANS[plan] || plan === 'free') fail(400, 'bad_plan');
  // Pix: AbacatePay, pré-pago (mensal ou anual). Cartão: Stripe, assinatura que renova sozinha.
  if (method === 'pix') return json({ ok: true, ...(await createPixCheckout(env, u, plan, period === 'anual' ? 12 : 1, back)) });
  const price = env['STRIPE_PRICE_' + plan.toUpperCase()];
  if (!env.STRIPE_SECRET_KEY || !price) return json({ ok: false, error: 'billing_unavailable', message: 'Pagamento ainda não está ativo. Fale com a gente pelo WhatsApp.' }, 503);
  const form = new URLSearchParams({
    mode: 'subscription', 'line_items[0][price]': price, 'line_items[0][quantity]': '1',
    success_url: back === 'start' ? `${env.APP_URL}/app/#/start?pago=1` : `${env.APP_URL}/app/#/home?upgraded=1`, cancel_url: `${env.APP_URL}/app/#/plano`,
    customer_email: u.email, 'metadata[user_id]': u.id, 'metadata[plan]': plan, 'subscription_data[metadata][user_id]': u.id, 'subscription_data[metadata][plan]': plan,
    locale: 'pt-BR', 'payment_method_types[0]': 'card',
  });
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'content-type': 'application/x-www-form-urlencoded' }, body: form });
  const d = await r.json();
  if (!r.ok) { console.error('stripe', d); fail(502, 'stripe_error', 'Não consegui abrir o pagamento.'); }
  return json({ ok: true, url: d.url });
}
