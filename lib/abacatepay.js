// Pix pela AbacatePay (API v2, checkout). Pix não renova sozinho: é pré-pago, mensal ou anual.
// Cada plano é um produto avulso criado no painel da AbacatePay; o id vai em ABACATE_PRODUCT_<PLANO> (mensal) e ABACATE_PRODUCT_<PLANO>_ANUAL.
import { fail, id, now } from './util.js';
import { run, one } from './db.js';

const API = 'https://api.abacatepay.com/v2';
export const abEnabled = env => !!env.ABACATE_API_KEY;
const productFor = (env, plan, months) => env[`ABACATE_PRODUCT_${plan.toUpperCase()}${months === 12 ? '_ANUAL' : ''}`] || null;
export const pixOptions = (env, plans) => !abEnabled(env) ? null : Object.fromEntries(Object.keys(plans).filter(k => k !== 'free').map(k => [k, { mensal: !!productFor(env, k, 1), anual: !!productFor(env, k, 12) }]));

export async function createPixCheckout(env, user, plan, months, back) {
  const product = productFor(env, plan, months);
  if (!abEnabled(env) || !product) fail(503, 'pix_unavailable', 'Pix ainda não está ativo para este plano. Use o cartão ou fale com a gente.');
  const pid = id('pay_');
  const done = back === 'start' ? `${env.APP_URL}/app/#/start?pago=1` : `${env.APP_URL}/app/#/home?pago=1`;
  const r = await fetch(`${API}/checkouts/create`, {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { authorization: `Bearer ${env.ABACATE_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ items: [{ id: product, quantity: 1 }], methods: ['PIX'], externalId: pid, metadata: { user_id: user.id, plan, months, payment_id: pid },
      returnUrl: `${env.APP_URL}/app/#/plano`, completionUrl: done }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.data?.url) { console.error('abacatepay', r.status, JSON.stringify(d).slice(0, 300)); fail(502, 'pix_error', 'Não consegui gerar o Pix agora. Tente de novo em instantes.'); }
  await run(env, 'INSERT INTO payments (id, user_id, provider, provider_id, plan, months, amount, status, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    pid, user.id, 'abacatepay', d.data.id || null, plan, months, d.data.amount || null, 'pending', now());
  return { url: d.data.url };
}

// Aplica um pagamento confirmado uma única vez: estende o plano a partir do fim do período atual, se ainda valer.
export async function applyPixPayment(env, data) {
  const pid = data?.metadata?.payment_id || data?.externalId || null;
  const pay = pid ? await one(env, 'SELECT * FROM payments WHERE id = ?', pid) : data?.id ? await one(env, 'SELECT * FROM payments WHERE provider_id = ?', data.id) : null;
  if (!pay) return { ok: false, reason: 'unknown_payment' };
  if (pay.status === 'paid') return { ok: true, already: true };
  if (data?.status && !/PAID|COMPLETED/i.test(data.status)) return { ok: false, reason: 'not_paid' };
  const u = await one(env, 'SELECT plan, plan_until FROM users WHERE id = ?', pay.user_id);
  const from = u?.plan === pay.plan && u.plan_until && u.plan_until > now() ? new Date(u.plan_until) : new Date();
  const until = new Date(from.getTime() + pay.months * 30 * 86400e3).toISOString();
  await run(env, "UPDATE payments SET status = 'paid', paid_at = ?, amount = COALESCE(?, amount) WHERE id = ? AND status != 'paid'", now(), data?.paidAmount ?? null, pay.id);
  await run(env, "UPDATE users SET plan = ?, plan_until = ?, plan_source = 'pix' WHERE id = ?", pay.plan, until, pay.user_id);
  return { ok: true, until };
}
