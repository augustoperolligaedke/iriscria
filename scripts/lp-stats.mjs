// Funil por página: visitas → cliques → foto → peça → cadastro (1º conteúdo) → Instagram → valor (baixou, copiou ou publicou).
// Uso: node scripts/lp-stats.mjs [--local] [--dias 14]
import { execFileSync } from 'node:child_process';
const where = process.argv.includes('--local') ? '--local' : '--remote';
const dias = Number(process.argv[process.argv.indexOf('--dias') + 1]) || 30;
const desde = new Date(Date.now() - dias * 86400e3).toISOString().slice(0, 10);
const NS = '2421c0daf94145b59ff857b0ede7c9a0';
// WRANGLER=wrangler@4.151.2 para ler o KV local gravado pelo servidor de desenvolvimento novo
const wr = args => execFileSync('npx', ['-y', process.env.WRANGLER || 'wrangler', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const keys = JSON.parse(wr(['kv', 'key', 'list', '--namespace-id', NS, '--prefix', 'stat:', where])).map(k => k.name).filter(k => k.split(':')[3] >= desde);
const EV = ['visita', 'clique', 'foto', 'peca', 'cadastro', 'instagram', 'valor', 'plano'];
const t = {};
for (const k of keys) {
  const [, lp, ev] = k.split(':');
  const n = Number(wr(['kv', 'key', 'get', k, '--namespace-id', NS, where]).trim()) || 0;
  t[lp] ||= Object.fromEntries(EV.map(e => [e, 0])); t[lp][ev] = (t[lp][ev] || 0) + n;
}
const pct = (a, b) => b ? (a / b * 100).toFixed(0) + '%' : '–';
console.log(`Últimos ${dias} dias (desde ${desde})\n`);
console.log('página'.padEnd(14), ...EV.map(e => e.padStart(9)), 'valor/visita'.padStart(13));
for (const [lp, v] of Object.entries(t).sort((a, b) => b[1].visita - a[1].visita))
  console.log(lp.padEnd(14), ...EV.map(e => String(v[e]).padStart(9)), pct(v.valor, v.visita).padStart(13));
if (!keys.length) console.log('(sem dados ainda)');
