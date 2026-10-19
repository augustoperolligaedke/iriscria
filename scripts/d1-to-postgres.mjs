// Copia os dados do D1 para o Postgres. Gera um .sql com INSERT ... ON CONFLICT DO NOTHING (pode rodar mais de uma vez).
// Uso: node scripts/d1-to-postgres.mjs --remote|--local saida.sql   →   psql "<conexão>" -f saida.sql
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const where = process.argv.includes('--remote') ? '--remote' : '--local';
const out = process.argv.find(a => a.endsWith('.sql')) || 'd1-dump.sql';
// ordem respeita dependências lógicas (não há foreign keys, mas fica legível)
const TABLES = ['users', 'sessions', 'otp_codes', 'brands', 'products', 'contents', 'usage', 'payments', 'instagram_accounts', 'ig_insights_cache', 'wa_links', 'wa_codes'];
const KEYS = { users: 'id', sessions: 'token', brands: 'id', products: 'id', contents: 'id', usage: 'user_id, period', payments: 'id', instagram_accounts: 'user_id', ig_insights_cache: 'user_id', wa_links: 'phone', wa_codes: 'code' };

const lit = v => v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
let sql = '-- dados copiados do D1 (' + where + ') em ' + new Date().toISOString() + '\nBEGIN;\n';
const counts = {};
for (const t of TABLES) {
  let rows = [];
  try {
    const raw = execFileSync('npx', ['wrangler', 'd1', 'execute', 'iris', where, '--json', '--command', `SELECT * FROM ${t}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024 });
    rows = JSON.parse(raw)[0]?.results || [];
  } catch { console.error('tabela ignorada (não existe no D1?):', t); continue; }
  counts[t] = rows.length;
  for (const r of rows) {
    const cols = Object.keys(r);
    sql += `INSERT INTO ${t} (${cols.join(',')}) VALUES (${cols.map(c => lit(r[c])).join(',')})${KEYS[t] ? ` ON CONFLICT (${KEYS[t]}) DO NOTHING` : ''};\n`;
  }
}
sql += 'COMMIT;\n';
writeFileSync(out, sql);
console.log('linhas por tabela:', JSON.stringify(counts), '→', out);
