import { json, readJson, fail } from '../../../lib/util.js';
import { normalizeStore, scrapeSite, scrapeInstagram, pickName, guessSiteFromHandle } from '../../../lib/brand.js';
import { inferBrand } from '../../../lib/llm.js';
import { readCatalog } from '../../../lib/catalog.js';
import { inferStrategy, normalizeStrategy } from '../../../lib/strategy.js';

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const n = normalizeStore(body.store);
  if (!n.site_url && !n.instagram) fail(400, 'invalid_store', 'Cole o link do site ou o @ do Instagram.');
  if (body.instagram && !n.instagram) n.instagram = String(body.instagram).replace(/^@/, '').toLowerCase().slice(0, 30);
  // só o @: procura o site da loja para puxar logo, cores e produtos
  let siteGuessed = false;
  if (n.instagram && !n.site_url) { n.site_url = await guessSiteFromHandle(n.instagram); siteGuessed = !!n.site_url; }
  let raw = { site_url: n.site_url || null, instagram: n.instagram || null, logo_candidates: [], bg: null, site_name: '', title: '', description: '', headings: [], text: '', images: [], colors: [], fonts: [], logo: null };
  if (n.site_url) raw = { ...raw, ...(await scrapeSite(n.site_url)) };
  let ig = null;
  const handle = n.instagram || raw.instagram;
  if (handle) raw.instagram = handle;
  if (n.instagram && !n.site_url) { ig = await scrapeInstagram(n.instagram); if (ig.description) { raw.description ||= ig.description; raw.text += ' ' + ig.description; } if (ig.image) { raw.logo ||= ig.image; raw.logo_candidates = [ig.image, ...(raw.logo_candidates || [])]; } }
  const [inferred, catalog] = await Promise.all([
    inferBrand(env, raw),
    n.site_url ? readCatalog(n.site_url, { final_url: raw.final_url, platform: raw.platform, vtex_account: raw.vtex_account }).catch(() => ({ products: [] })) : { products: [] },
  ]);
  // catálogo real (nome, preço, foto) vence; imagens soltas da home só se o catálogo não abrir
  let products = catalog.products;
  if (!products.length) {
    const fromLlm = (inferred.products || []).filter(p => p.image_url).slice(0, 6);
    products = [...fromLlm, ...raw.images.filter(i => !fromLlm.some(p => p.image_url === i.src)).slice(0, 12).map(i => ({ name: i.alt || 'Produto', price: null, image_url: i.src }))];
  }
  return json({ ok: true, brand: {
    name: (n.site_url ? pickName(raw, inferred.brand_name, n) : prettyHandle(n.instagram)) || null, site_url: n.site_url || null, instagram: n.instagram || raw.instagram || null,
    // cores finais saem do logo e do fundo do site, extraídas no navegador; estas são o ponto de partida
    colors: { primary: inferred.palette?.primary || raw.colors[0] || '#1F140D', secondary: raw.bg || inferred.palette?.secondary || '#FFFFFF', accent: inferred.palette?.accent || '#FFD83A' },
    font: inferred.font || raw.fonts[0] || 'Manrope', tone: inferred.tone || '', icp: inferred.icp || '', logo_url: raw.logo || null,
    strategy: normalizeStrategy({ ...inferStrategy(raw, products, inferred.category, catalog.platform), ...(inferred.differential ? { differential: inferred.differential } : {}), ...(inferred.occasions ? { occasions: inferred.occasions } : {}) }),
  }, products, meta: { catalog: catalog.platform || null, site_guessed: siteGuessed, need_site: !n.site_url, site_error: raw.error || null, instagram_blocked: !!ig?.blocked, colors_found: raw.colors, fonts_found: raw.fonts, site_bg: raw.bg || null, logo_candidates: raw.logo_candidates || [] } });
}

const prettyHandle = h => String(h || '').replace(/[._]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
