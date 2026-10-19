import { json } from '../../lib/util.js';
import { getBrand, parseBrand, all } from '../../lib/db.js';
import { usageFor } from '../../lib/generate.js';
import { PLANS, planOf } from '../../lib/plans.js';
import { waEnabled } from '../../lib/tyxter.js';
import { igEnabled, accountFor } from '../../lib/instagram.js';
import { pixOptions } from '../../lib/abacatepay.js';

export async function onRequestGet({ env, data }) {
  if (!data.user) return json({ ok: true, user: null, google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) });
  const brand = parseBrand(await getBrand(env, data.user.id));
  const products = brand ? await all(env, 'SELECT * FROM products WHERE brand_id = ? ORDER BY created_at DESC LIMIT 50', brand.id) : [];
  const usage = await usageFor(env, data.user);
  const plan = planOf(data.user);
  const ig = igEnabled(env) ? await accountFor(env, data.user.id).catch(() => null) : null;
  return json({ ok: true, user: { id: data.user.id, email: data.user.email, phone: data.user.phone, plan, plan_name: PLANS[plan].name }, brand, products, usage, plans: PLANS,
    whatsapp: waEnabled(env) ? { phone: env.TYXTER_SENDER_PHONE || null } : null, stripe: !!env.STRIPE_SECRET_KEY,
    google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    billing: { card: !!env.STRIPE_SECRET_KEY, pix: pixOptions(env, PLANS), source: data.user.plan_source || null, until: data.user.plan_until || null,
      renew_soon: data.user.plan_source === 'pix' && plan !== 'free' && !!data.user.plan_until && (new Date(data.user.plan_until) - Date.now()) < 5 * 86400e3 },
    instagram: { enabled: igEnabled(env), account: ig ? { username: ig.username, picture_url: ig.picture_url, expired: !!ig.expired } : null } });
}
