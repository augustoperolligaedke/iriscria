// Métricas das postagens da semana (desde segunda) no Instagram conectado, por etapa do funil. Cache de 3 h.
import { json, now } from '../../../lib/util.js';
import { requireUser } from '../../../lib/auth.js';
import { one, run } from '../../../lib/db.js';
import { igEnabled, accountFor, weekMedia, aggregateWeek } from '../../../lib/instagram.js';

const monday = () => { const d = new Date(Date.now() - 3 * 3600e3); d.setUTCHours(3, 0, 0, 0); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d; }; // segunda 00h em Brasília

export async function onRequestGet({ request, env, data }) {
  const u = requireUser(data);
  if (!igEnabled(env)) return json({ ok: true, connected: false });
  const acc = await accountFor(env, u.id);
  if (!acc || acc.expired) return json({ ok: true, connected: false, expired: !!acc?.expired });
  const since = monday(), week = since.toISOString().slice(0, 10);
  const fresh = new URL(request.url).searchParams.get('refresh') === '1';
  const c = await one(env, 'SELECT * FROM ig_insights_cache WHERE user_id = ?', u.id);
  if (!fresh && c && c.week === week && Date.now() - new Date(c.updated_at) < 3 * 3600e3) return json({ ok: true, connected: true, cached: true, updated_at: c.updated_at, ...JSON.parse(c.payload) });
  try {
    const media = await weekMedia(env, acc, since);
    const payload = { since: since.toISOString(), ...aggregateWeek(media) };
    await run(env, 'INSERT INTO ig_insights_cache (user_id, week, payload, updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET week=excluded.week, payload=excluded.payload, updated_at=excluded.updated_at', u.id, week, JSON.stringify(payload), now());
    return json({ ok: true, connected: true, updated_at: now(), ...payload });
  } catch (e) {
    // sem a permissão de métricas (conexões antigas) ou erro do Instagram: devolve o cache se houver
    if (c) return json({ ok: true, connected: true, stale: true, updated_at: c.updated_at, ...JSON.parse(c.payload) });
    return json({ ok: true, connected: true, error: e.message || 'Não consegui ler as métricas agora.' });
  }
}
