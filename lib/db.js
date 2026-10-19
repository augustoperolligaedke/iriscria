import { now, id } from './util.js';

import postgres from 'postgres';

// Banco: Postgres (Supabase via Hyperdrive) quando houver conexão; senão D1. As consultas usam "?" nos dois.
const pgUrl = env => env.HYPERDRIVE?.connectionString || env.DATABASE_URL || null;
const toPg = sql => { let i = 0; return sql.replace(/\?/g, () => '$' + (++i)); };
const INT8 = { to: 20, from: [20], serialize: x => String(x), parse: x => Number(x) }; // count/sum como número, igual ao D1

async function pg(env, sql, args) {
  // Workers não reaproveitam conexão entre requisições; o Hyperdrive mantém o pool do lado dele.
  const c = postgres(pgUrl(env), { max: 1, fetch_types: false, prepare: false, types: { int8: INT8 }, connect_timeout: 10 });
  try { return await c.unsafe(toPg(sql), args.map(v => v === undefined ? null : v)); }
  finally { c.end({ timeout: 1 }).catch(() => {}); }
}

export const dbKind = env => pgUrl(env) ? 'postgres' : 'd1';
export const one = async (env, sql, ...args) => pgUrl(env) ? ((await pg(env, sql, args))[0] ?? null) : env.DB.prepare(sql).bind(...args).first();
export const all = async (env, sql, ...args) => pgUrl(env) ? [...(await pg(env, sql, args))] : (await env.DB.prepare(sql).bind(...args).all()).results;
export const run = async (env, sql, ...args) => { if (pgUrl(env)) { await pg(env, sql, args); return {}; } return env.DB.prepare(sql).bind(...args).run(); };

export async function getBrand(env, userId) {
  return one(env, 'SELECT * FROM brands WHERE user_id = ? ORDER BY created_at ASC LIMIT 1', userId);
}
export async function upsertBrand(env, userId, data) {
  const cur = await getBrand(env, userId);
  const t = now();
  const colors = JSON.stringify(data.colors || {});
  if (cur) {
    await run(env, 'UPDATE brands SET name=?, site_url=?, instagram=?, colors=?, font=?, tone=?, icp=?, logo_url=?, strategy=?, updated_at=? WHERE id=?',
      data.name ?? cur.name, data.site_url ?? cur.site_url, data.instagram ?? cur.instagram, colors, data.font ?? cur.font, data.tone ?? cur.tone, data.icp ?? cur.icp, data.logo_url ?? cur.logo_url, data.strategy ? JSON.stringify(data.strategy) : cur.strategy, t, cur.id);
    return getBrand(env, userId);
  }
  const bid = id('b_');
  await run(env, 'INSERT INTO brands (id,user_id,name,site_url,instagram,colors,font,tone,icp,logo_url,strategy,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    bid, userId, data.name || null, data.site_url || null, data.instagram || null, colors, data.font || null, data.tone || null, data.icp || null, data.logo_url || null, data.strategy ? JSON.stringify(data.strategy) : null, t, t);
  return getBrand(env, userId);
}
export const parseBrand = b => b && ({ ...b, colors: safeJson(b.colors, {}), strategy: safeJson(b.strategy, {}) || {} });
export const parseContent = c => c && ({ ...c, spec: safeJson(c.spec, {}) });
export function safeJson(s, d) { try { return JSON.parse(s); } catch { return d; } }
