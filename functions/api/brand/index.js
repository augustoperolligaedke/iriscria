import { json, readJson, clean } from '../../../lib/util.js';
import { requireUser } from '../../../lib/auth.js';
import { getBrand, upsertBrand, parseBrand } from '../../../lib/db.js';
import { normalizeStrategy } from '../../../lib/strategy.js';

export async function onRequestGet({ env, data }) {
  const u = requireUser(data);
  return json({ ok: true, brand: parseBrand(await getBrand(env, u.id)) });
}
export async function onRequestPut({ request, env, data }) {
  const u = requireUser(data);
  const b = await readJson(request);
  const colors = b.colors && typeof b.colors === 'object' ? Object.fromEntries(Object.entries(b.colors).filter(([k, v]) => ['primary', 'secondary', 'accent'].includes(k) && /^#[0-9a-f]{6}$/i.test(v))) : undefined;
  const brand = await upsertBrand(env, u.id, { name: clean(b.name, 80), site_url: clean(b.site_url, 300) || null, instagram: clean(b.instagram, 60).replace(/^@/, '') || null, colors, font: clean(b.font, 60) || null, tone: clean(b.tone, 400) || null, icp: clean(b.icp, 400) || null, logo_url: clean(b.logo_url, 500) || null, strategy: b.strategy ? normalizeStrategy(b.strategy) : null });
  return json({ ok: true, brand: parseBrand(brand) });
}
