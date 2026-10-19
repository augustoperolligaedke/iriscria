// Lê o site da loja: cores, fontes, imagens de produto, textos. Instagram: melhor esforço (quase sempre bloqueado sem login).
import { absUrl, clean } from './util.js';

// Cabeçalho de navegador comum: muitas lojas recusam user-agent de robô. Não burlamos desafio anti-robô; se houver, caímos no ícone público.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const HDRS = { 'user-agent': UA, accept: 'text/html,application/xhtml+xml', 'accept-language': 'pt-BR,pt;q=0.9,en;q=0.6' };
const IG_RESERVED = /^(p|reel|reels|explore|stories|accounts|tv|direct|about|developer|legal)$/i;
const SYSTEM_FONTS = /^(inherit|initial|unset|sans-serif|serif|monospace|system-ui|-apple-system|blinkmacsystemfont|segoe ui|roboto|helvetica( neue)?|arial|ui-sans-serif|ui-serif|times new roman|georgia|courier new|var\(.*)$/i;
// banners e peças de layout da home não são produto
const BANNER_IMG = /(banner|carrossel|carousel|slide|hero|vitrine|full|desktop|mobile|header|footer|pag[-_ ]?inicial|home[-_])/i;
const SKIP_IMG = /(logo|icon|sprite|favicon|badge|selo|pixel|tracking|banner|\.svg|\.gif|payment|pagamento|flag|bandeira|whatsapp|instagram|facebook)/i;

export function normalizeStore(input) {
  let s = String(input || '').trim();
  if (!s) return {};
  if (/^@/.test(s) || /^instagram\.com\//i.test(s) || /instagram\.com\//i.test(s)) {
    const h = s.replace(/^(https?:\/\/)?(www\.|m\.)?instagram\.com\//i, '').replace(/^@/, '').split(/[/?#]/)[0];
    return { instagram: h.toLowerCase() };
  }
  if (!/^[a-z0-9.-]+\.[a-z]{2,}/i.test(s.replace(/^https?:\/\//, ''))) return { instagram: s.replace(/^@/, '').toLowerCase() };
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try { const u = new URL(s); return { site_url: u.origin + (u.pathname === '/' ? '' : u.pathname) }; } catch { return {}; }
}

export async function scrapeSite(siteUrl) {
  const raw = { site_url: siteUrl, title: '', site_name: '', description: '', headings: [], text: '', images: [], colors: [], fonts: [], logo: null, logos: [], icons: [], bg: null, instagram: null, stylesheets: [], css: '' };
  raw.fallback_icon = googleIcon(siteUrl);
  let res;
  try { res = await fetch(siteUrl, { headers: HDRS, redirect: 'follow', signal: AbortSignal.timeout(10000) }); }
  catch (e) { raw.error = 'fetch_failed'; return finish(raw); }
  const challenged = res.headers.get('cf-mitigated') === 'challenge';
  if (!res.ok || challenged) { raw.error = challenged || res.status === 403 || res.status === 503 ? 'blocked' : 'http_' + res.status; return finish(raw); }
  const base = res.url || siteUrl;
  let text = '', inHeader = 0, ldjson = '', inLd = false;
  const rewriter = new HTMLRewriter()
    .on('title', { text(t) { raw.title += t.text; } })
    .on('meta', { element(e) {
      const n = (e.getAttribute('name') || e.getAttribute('property') || '').toLowerCase(), c = e.getAttribute('content') || '';
      if (n === 'description' || n === 'og:description') raw.description ||= c;
      if (n === 'og:image') raw.ogImage ||= absUrl(c, base);
      if (n === 'og:site_name') raw.site_name ||= clean(c, 60);
      if (n === 'theme-color' && /^#[0-9a-f]{3,6}$/i.test(c)) raw.colors.push(c);
    } })
    .on('link', { element(e) {
      const rel = (e.getAttribute('rel') || '').toLowerCase(), href = e.getAttribute('href') || '';
      if (rel.includes('stylesheet') && href) raw.stylesheets.push(absUrl(href, base));
      if (rel.includes('icon') && href) { const size = parseInt((e.getAttribute('sizes') || '0').split('x')[0]) || (rel.includes('apple') ? 180 : 16); raw.icons.push({ src: absUrl(href, base), size }); }
      if (href.includes('fonts.googleapis.com')) { const m = /family=([^&:]+)/.exec(decodeURIComponent(href)); if (m) raw.fonts.push(m[1].replace(/\+/g, ' ').split('|')[0]); }
    } })
    .on('script[type="application/ld+json"]', { element() { inLd = true; }, text(t) { if (inLd) ldjson += t.text; if (t.lastInTextNode) { ldjson += '\n\u0000'; inLd = false; } } })
    .on('style', { text(t) { raw.css += t.text; } })
    .on('header, [class*="header"], [class*="Header"], nav', { element(e) { try { e.onEndTag(() => inHeader--); inHeader++; } catch { } } })
    .on('a', { element(e) {
      const href = e.getAttribute('href') || '';
      const m = /instagram\.com\/([A-Za-z0-9_.]{2,30})/i.exec(href);
      if (m && !raw.instagram && !IG_RESERVED.test(m[1])) raw.instagram = m[1].toLowerCase();
    } })
    .on('h1, h2, h3', { text(t) { if (t.text.trim()) raw.headings.push(clean(t.text, 120)); } })
    .on('p, li, span, a', { text(t) { if (t.text.trim()) text += ' ' + t.text; } })
    .on('img', { element(e) {
      const src = e.getAttribute('src') || e.getAttribute('data-src') || (e.getAttribute('srcset') || '').split(',')[0].trim().split(' ')[0];
      const alt = e.getAttribute('alt') || '', cls = (e.getAttribute('class') || '') + ' ' + (e.getAttribute('id') || '');
      const abs = src && absUrl(src.replace(/&amp;/g, '&'), base);
      if (!abs || !/^https?:/.test(abs)) return;
      if (/logo|marca|brand/i.test(src + ' ' + alt + ' ' + cls)) raw.logos.push({ src: abs, score: inHeader ? 5 : 3 });
      else if (!SKIP_IMG.test(abs + ' ' + alt) && !BANNER_IMG.test(abs + ' ' + alt + ' ' + cls)) raw.images.push({ src: abs, alt: clean(alt, 80) });
    } });
  const html = await rewriter.transform(res).text();
  if (/<title>\s*Just a moment|challenges\.cloudflare\.com|cf-browser-verification/i.test(html.slice(0, 4000))) { raw.error = 'blocked'; return finish(raw); }
  raw.final_url = base;
  const acc = /\/\/([a-z0-9-]+)\.vte?x(?:img|assets)\.com/i.exec(html);
  raw.platform = acc || /vtex/i.test(html) ? 'vtex' : /cdn\.shopify\.com|Shopify\.theme/i.test(html) ? 'shopify' : /woocommerce/i.test(html) ? 'woocommerce' : /nuvemshop|tiendanube/i.test(html) ? 'nuvemshop' : null;
  if (acc) raw.vtex_account = acc[1].toLowerCase();
  // JSON-LD: Organization/Store dá nome e logo oficiais
  for (const chunk of ldjson.split('\u0000')) {
    try {
      const walk = o => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk); if (o['@graph']) walk(o['@graph']);
        const t = [].concat(o['@type'] || []).join(' ');
        if (/Organization|Store|Brand|WebSite/i.test(t)) { if (o.name && !/WebSite/i.test(t)) raw.ld_name ||= clean(o.name, 60); const lg = typeof o.logo === 'string' ? o.logo : o.logo?.url; if (lg) raw.logos.push({ src: absUrl(lg, base), score: 2 });
          [].concat(o.sameAs || []).forEach(u => { const m = /instagram\.com\/([A-Za-z0-9_.]{2,30})/i.exec(u); if (m && !raw.instagram) raw.instagram = m[1].toLowerCase(); }); } };
      walk(JSON.parse(chunk.trim()));
    } catch { }
  }
  raw.text = clean(text, 6000);
  raw.headings = dedupe(raw.headings).slice(0, 40);
  raw.images = dedupe(raw.images.map(i => JSON.stringify(i))).map(s => JSON.parse(s)).slice(0, 40);
  const sheets = raw.stylesheets.filter(Boolean).slice(0, 3);
  const cssTexts = await Promise.all(sheets.map(u => fetch(u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(6000) }).then(r => r.ok ? r.text() : '').catch(() => '')));
  const css = (raw.css + '\n' + cssTexts.join('\n')).slice(0, 600000);
  raw.bg = bodyBackground(css);
  raw.colors = dedupe([...raw.colors, ...topColors(css)]).slice(0, 12);
  raw.fonts = dedupe([...raw.fonts, ...topFonts(css)]).slice(0, 5);
  return finish(raw);
}

// Ordem de confiança do logo: JSON-LD > <img> de logo no cabeçalho > outro <img> de logo > ícone grande > og:image > ícone público do Google.
function finish(raw) {
  const icons = raw.icons.filter(i => i.src && !/\.ico(\?|$)/i.test(i.src)).sort((a, b) => b.size - a.size);
  const junk = /(coupon|cupo[mn]|discount|desconto|codes?\.co|promocode|placeholder)/i;
  raw.logos = raw.logos.filter(l => l.src && !junk.test(l.src));
  const list = [...raw.logos.sort((a, b) => b.score - a.score).map(l => l.src), ...icons.filter(i => i.size >= 96).map(i => i.src), raw.fallback_icon, raw.ogImage];
  raw.logo_candidates = dedupe(list).slice(0, 5);
  raw.logo = raw.logo_candidates[0] || null;
  delete raw.css; delete raw.stylesheets; delete raw.icons; delete raw.logos;
  return raw;
}
export const googleIcon = siteUrl => { try { return `https://www.google.com/s2/favicons?domain=${new URL(siteUrl).hostname}&sz=256`; } catch { return null; } };

// Nome da marca: og:site_name, JSON-LD e título, descartando nomes de plataforma. Prefere o que bate com o domínio.
const PLATFORM = /^(vtex|faststore|shopify|nuvemshop|tiendanube|tray|wix|woocommerce|wordpress|magento|deco|loja integrada|yampi|bagy|home|in[ií]cio|loja virtual|p[aá]gina inicial)$/i;
export function pickName(raw, llmName, n) {
  const fold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const domain = n.site_url ? nameFromDomain(n.site_url) : '';
  const titleParts = String(raw.title || '').split(/\s[|–\-:·]\s/).map(t => clean(t, 40));
  const cands = [raw.site_name, raw.ld_name, ...titleParts, llmName].map(c => clean(c, 40)).filter(c => c && !PLATFORM.test(c) && c.length <= 32);
  const d = fold(domain);
  return cands.find(c => d && (fold(c).includes(d) || d.includes(fold(c)))) || cands[0] || domain || n.instagram || '';
}

// Nome a partir do domínio quando o site não diz: usereserva.com → Reserva, lojadamaria.com.br → Maria.
export function nameFromDomain(siteUrl) {
  try {
    let h = new URL(siteUrl).hostname.replace(/^www\d?\./, '').split('.')[0];
    h = h.replace(/^(use|loja(da|do|de)?|shop|store|meu|minha|vista|compre)(?=[a-z]{3,})/i, '').replace(/(oficial|store|shop|loja|online|br)$/i, '') || h;
    return h.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  } catch { return ''; }
}

function bodyBackground(css) {
  const re = /(?:^|[}\s,])(?:html|body|:root)\s*(?:,[^{]*)?\{([^}]*)\}/gi; let m, found = null;
  while ((m = re.exec(css))) {
    const b = /background(?:-color)?\s*:\s*(#[0-9a-f]{3,6}\b|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|white)/i.exec(m[1]);
    if (b) found = b[1];
  }
  if (!found) return null;
  if (/white/i.test(found)) return '#ffffff';
  if (found.startsWith('rgb')) return '#' + found.match(/\d+/g).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
  return found.length === 4 ? '#' + found.slice(1).split('').map(c => c + c).join('') : found.toLowerCase();
}

// @ → site da loja: tenta domínios óbvios e só aceita se o endereço final bate com o @ (evita site de outra marca).
export async function guessSiteFromHandle(handle) {
  const fold = x => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const base = fold(handle), stripped = base.replace(/^(loja|use)(?=[a-z]{3,})/, '').replace(/(oficial|official|store|loja|shop|brasil|br)$/, '');
  const names = [...new Set([base, stripped].filter(n => n.length >= 3))];
  const cands = names.flatMap(n => [`https://${n}.com.br`, `https://${n}.com`]).slice(0, 4);
  const hits = await Promise.all(cands.map(async (u, i) => {
    try {
      const r = await fetch(u, { headers: HDRS, redirect: 'follow', signal: AbortSignal.timeout(6000) });
      const label = fold(new URL(r.url).hostname.replace(/^www\d?\./, '').split('.')[0]);
      if (r.status >= 500 || !names.some(n => label === n || label === 'use' + n || 'use' + label === n)) return null;
      return { i, url: new URL(r.url).origin };
    } catch { return null; }
  }));
  return hits.filter(Boolean).sort((a, b) => a.i - b.i)[0]?.url || null;
}

export async function scrapeInstagram(handle) {
  try {
    const r = await fetch(`https://www.instagram.com/${encodeURIComponent(handle)}/`, { headers: HDRS, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return { instagram: handle, blocked: true };
    const html = await r.text();
    const og = /property="og:description" content="([^"]*)"/.exec(html), img = /property="og:image" content="([^"]*)"/.exec(html);
    if (!og) return { instagram: handle, blocked: true };
    return { instagram: handle, description: og[1], image: img && img[1].replace(/&amp;/g, '&') };
  } catch { return { instagram: handle, blocked: true }; }
}

function topColors(css) {
  const counts = new Map();
  const re = /#([0-9a-f]{6}|[0-9a-f]{3})\b|rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi; let m;
  while ((m = re.exec(css))) {
    let hex;
    if (m[1]) hex = m[1].length === 3 ? '#' + m[1].split('').map(c => c + c).join('') : '#' + m[1];
    else hex = '#' + [m[2], m[3], m[4]].map(n => (+n).toString(16).padStart(2, '0')).join('');
    hex = hex.toLowerCase();
    if (isGrey(hex)) continue;
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
}
function isGrey(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max - min < 18 || max < 40 || (min > 235);
}
function topFonts(css) {
  const counts = new Map();
  const re = /font-family\s*:\s*([^;}!]+)/gi; let m;
  while ((m = re.exec(css))) {
    const first = m[1].split(',')[0].replace(/["']/g, '').trim();
    if (!first || SYSTEM_FONTS.test(first) || /awesome|icons?$|glyph|symbol/i.test(first) || first.length > 40) continue;
    counts.set(first, (counts.get(first) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
}
const dedupe = a => [...new Set(a.filter(Boolean))];

function nameFromUrl(u) {
  try { const f = decodeURIComponent(new URL(u).pathname.split('/').pop() || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').replace(/\b\d{2,}\b/g, '').trim(); return f.length > 2 ? f.slice(0, 60).replace(/\b\w/g, c => c.toUpperCase()) : ''; } catch { return ''; }
}
