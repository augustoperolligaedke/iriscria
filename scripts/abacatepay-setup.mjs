#!/usr/bin/env node
// Prepara o Pix da AbacatePay (API v2): cria um produto avulso por plano (mensal e anual = 10 meses),
// registra o webhook checkout.completed e imprime as variáveis. Com --pages grava tudo como secrets do Pages.
//
//   ABACATE_API_KEY=abc_... node scripts/abacatepay-setup.mjs            # só imprime
//   ABACATE_API_KEY=abc_... node scripts/abacatepay-setup.mjs --pages    # imprime e grava no projeto Pages
//
// Sem ABACATE_API_KEY no ambiente, lê de .dev.vars. Rode com a chave de produção (Dev mode desligado) para valer de verdade;
// com a chave de teste os produtos e o webhook nascem em devMode e o app ignora esses pagamentos, salvo ABACATE_ACCEPT_DEV=1.
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const PLANS = { basico: ['Básico', 5900], pro: ['Pro', 14900], loja: ['Loja', 29900] };
const API = 'https://api.abacatepay.com/v2';
const PROJECT = process.env.PAGES_PROJECT || 'iriscria';

const vars = {};
if (existsSync('.dev.vars')) for (const l of readFileSync('.dev.vars', 'utf8').split('\n')) { const m = /^([A-Z_]+)=(.*)$/.exec(l.trim()); if (m) vars[m[1]] = m[2]; }
const key = process.env.ABACATE_API_KEY || vars.ABACATE_API_KEY;
if (!key) { console.error('Falta ABACATE_API_KEY (ambiente ou .dev.vars). Crie a chave em app.abacatepay.com > Integrar > Chaves de API.'); process.exit(1); }
const appUrl = (process.env.APP_URL || 'https://iriscria.pages.dev').replace(/\/$/, '');
const secret = process.env.ABACATE_WEBHOOK_SECRET || vars.ABACATE_WEBHOOK_SECRET || randomBytes(24).toString('base64url');

async function call(path, body) {
  const r = await fetch(API + path, { method: body ? 'POST' : 'GET', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.success === false) throw new Error(`${path} ${r.status}: ${d.error || JSON.stringify(d).slice(0, 200)}`);
  return d.data;
}

const out = { ABACATE_API_KEY: key, ABACATE_WEBHOOK_SECRET: secret };
let devMode = null;
for (const [k, [name, cents]] of Object.entries(PLANS)) {
  for (const [suffix, months] of [['', 1], ['_ANUAL', 12]]) {
    const externalId = `iris-${k}-${months === 12 ? 'anual' : 'mensal'}`;
    const list = await call(`/products/list?externalId=${externalId}&status=ACTIVE`);
    let p = Array.isArray(list) ? list.find(x => x.externalId === externalId) : null;
    if (!p) {
      p = await call('/products/create', { externalId, name: `Íris ${name} · ${months === 12 ? 'anual (2 meses grátis)' : 'mensal'}`, price: months === 12 ? cents * 10 : cents, currency: 'BRL',
        description: months === 12 ? `Plano ${name} da Íris por 12 meses, pagando 10. Pix pré-pago, sem renovação automática.` : `Plano ${name} da Íris por 30 dias. Pix pré-pago, sem renovação automática.` });
      console.log(`criado  ${externalId} → ${p.id} (R$ ${(p.price / 100).toFixed(2)})`);
    } else console.log(`existe  ${externalId} → ${p.id} (R$ ${(p.price / 100).toFixed(2)})`);
    devMode = p.devMode;
    out[`ABACATE_PRODUCT_${k.toUpperCase()}${suffix}`] = p.id;
  }
}

const endpoint = `${appUrl}/api/billing/abacatepay?webhookSecret=${secret}`;
const hooks = await call('/webhooks/list').catch(() => []);
const has = (Array.isArray(hooks) ? hooks : []).find(h => String(h.endpoint || '').startsWith(`${appUrl}/api/billing/abacatepay`));
if (has) console.log(`webhook existe → ${has.id} (${has.endpoint.replace(/webhookSecret=.*/, 'webhookSecret=…')})`);
else { const w = await call('/webhooks/create', { name: 'Íris · Pix', endpoint, secret, events: ['checkout.completed'] }); console.log(`webhook criado → ${w.id}`); }
if (has && !String(has.endpoint).includes(secret)) console.log('Atenção: o webhook já cadastrado usa outro webhookSecret. Use o mesmo valor em ABACATE_WEBHOOK_SECRET ou apague o webhook no painel e rode de novo.');

console.log(`\nModo: ${devMode ? 'DEV (teste, pagamentos simulados)' : 'produção'}`);
console.log('\nVariáveis (secrets do Pages / .dev.vars):');
for (const [k, v] of Object.entries(out)) console.log(`${k}=${k === 'ABACATE_API_KEY' ? v.slice(0, 6) + '…' : v}`);

if (process.argv.includes('--pages')) {
  const r = spawnSync('npx', ['-y', 'wrangler@4.151.2', 'pages', 'secret', 'bulk', '--project-name', PROJECT], { input: JSON.stringify(out), stdio: ['pipe', 'inherit', 'inherit'], env: { ...process.env, PATH: `/opt/homebrew/bin:${process.env.PATH}` } });
  if (r.status !== 0) { console.error('Falha ao gravar os secrets no Pages.'); process.exit(r.status || 1); }
  console.log('\nSecrets gravados no Pages. Faça um deploy para o app passar a oferecer Pix.');
} else console.log('\nPara gravar no Pages: node scripts/abacatepay-setup.mjs --pages');
