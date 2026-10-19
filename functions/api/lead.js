// Cloudflare Pages Function: registra leads da landing em dois passos.
// etapa "loja": link ou @ da loja (CTA). etapa "contato": e-mail ou WhatsApp na página de validação.
// Grava no KV LEADS; opcionalmente envia o JSON para LEAD_WEBHOOK.
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }
  if (data.fax) return json({ ok: true }); // honeypot

  // eventos das landing pages de validação: visita, clique, cadastro. Soma por página e por dia.
  if (data.etapa === 'evento') {
    const lp = String(data.lp || 'site').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30) || 'site';
    const ev = ['visita', 'clique', 'cadastro'].includes(data.evento) ? data.evento : null;
    if (!ev) return json({ ok: false, error: 'invalid_evento' }, 400);
    if (/bot|crawl|spider|preview|headless/i.test(request.headers.get('user-agent') || '')) return json({ ok: true, ignored: 'bot' });
    if (env.LEADS) {
      const key = `stat:${lp}:${ev}:${new Date().toISOString().slice(0, 10)}`;
      const n = Number(await env.LEADS.get(key)) || 0;
      await env.LEADS.put(key, String(n + 1));
    }
    return json({ ok: true });
  }

  const loja = String(data.loja || '').trim().replace(/^https?:\/\//, '').slice(0, 200);
  const contato = String(data.contato || '').trim().slice(0, 120);
  const etapa = data.etapa === 'contato' ? 'contato' : 'loja';

  if (etapa === 'loja' && loja.length < 3) return json({ ok: false, error: 'invalid_loja' }, 400);
  if (etapa === 'contato') {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contato);
    const isPhone = contato.replace(/\D/g, '').length >= 10;
    if (!isEmail && !isPhone) return json({ ok: false, error: 'invalid_contato' }, 400);
  }

  const lead = {
    etapa,
    loja,
    contato,
    origem: String(data.origem || '').slice(0, 300),
    lp: String(data.lp || 'site').slice(0, 30),
    ua: request.headers.get('user-agent') || '',
    pais: request.cf?.country || '',
    ts: new Date().toISOString(),
  };

  if (env.LEADS) {
    await env.LEADS.put(`lead:${lead.ts}:${etapa}:${(loja || contato).toLowerCase()}`, JSON.stringify(lead));
  } else {
    console.log('LEAD (sem KV vinculado)', JSON.stringify(lead));
  }
  if (env.LEAD_WEBHOOK) {
    await fetch(env.LEAD_WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(lead) }).catch(() => {});
  }
  return json({ ok: true });
}

export const onRequest = ({ request }) =>
  request.method === 'POST' ? undefined : json({ ok: false, error: 'method_not_allowed' }, 405);
