// Lê o catálogo da loja pela URL, sem login: endpoints públicos de cada plataforma e, como reserva, páginas de produto do sitemap.
// Saída: [{ name, price, image_url, images, url, category }] com até `limit` produtos com foto.

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const H = { 'user-agent': UA, accept: 'application/json,text/html;q=0.9,*/*;q=0.8', 'accept-language': 'pt-BR,pt;q=0.9' };
const get = (url, ms = 8000) => fetch(url, { headers: H, redirect: 'follow', signal: AbortSignal.timeout(ms) });
async function getJson(url, ms) { try { const r = await get(url, ms); if (!r.ok && r.status !== 206) return null; if (!/json/i.test(r.headers.get('content-type') || '')) return null; return await r.json(); } catch { return null; } }
async function getText(url, ms) { try { const r = await get(url, ms); return r.ok ? await r.text() : null; } catch { return null; } }

export const brl = v => { const n = Number(String(v).replace(/[^\d.,]/g, '').replace(/,(\d{2})$/, '.$1')); return n > 0 ? 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) : null; };
const decode = s => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const cleanName = s => decode(s).replace(/\s+/g, ' ').slice(0, 80);

// itens que aparecem no catálogo mas não servem de conteúdo
const NOT_PRODUCT = /^(assinatura|gift ?card|cart[aã]o presente|vale[ -]presente|embalagem|sacola|frete|taxa|brinde|teste)\b/i;

export async function readCatalog(siteUrl, hints = {}, limit = 24) {
  const origin = new URL(hints.final_url || siteUrl).origin;
  const tries = [
    ['shopify', () => shopify(origin, limit)],
    ['vtex', () => vtex(origin, hints.vtex_account, limit)],
    ['woocommerce', () => woo(origin, limit)],
    ['nuvemshop', () => nuvemshop(origin, limit)],
    ['sitemap', () => fromSitemap(origin, Math.min(limit, 10))],
  ];
  // plataforma detectada no HTML vai primeiro
  if (hints.platform) tries.sort((a, b) => (b[0] === hints.platform) - (a[0] === hints.platform));
  for (const [platform, fn] of tries) {
    let list = [];
    try { list = await fn(); } catch (e) { console.error('catalog', platform, e); }
    list = list.filter(p => p && p.name && p.image_url && /^https?:/.test(p.image_url) && !NOT_PRODUCT.test(p.name));
    list = dedupeBy(dedupeBy(list, p => p.image_url), p => p.name.toLowerCase()).slice(0, limit);
    if (list.length >= 2) return { platform, products: list };
  }
  return { platform: null, products: [] };
}

async function shopify(origin, limit) {
  const d = await getJson(`${origin}/products.json?limit=${limit}`);
  if (!d?.products) return [];
  return d.products.filter(p => p.variants?.some(v => v.available !== false)).map(p => ({
    name: cleanName(p.title), price: brl(p.variants?.[0]?.price), image_url: p.images?.[0]?.src, images: (p.images || []).slice(0, 5).map(i => i.src),
    url: `${origin}/products/${p.handle}`, category: p.product_type || null,
  }));
}

async function vtex(origin, account, limit) {
  const path = `/api/catalog_system/pub/products/search?_from=0&_to=${limit + 12}&O=OrderByTopSaleDESC`;
  let d = await getJson(origin + path, 10000);
  if (!Array.isArray(d) && account) d = await getJson(`https://${account}.vtexcommercestable.com.br${path}`, 10000);
  if (!Array.isArray(d)) return [];
  return d.map(p => {
    const item = (p.items || []).find(i => i.sellers?.some(s => s.commertialOffer?.AvailableQuantity > 0)) || null;
    if (!item) return null;
    const offer = item.sellers.find(s => s.commertialOffer?.AvailableQuantity > 0).commertialOffer;
    return { name: cleanName(p.productName), price: brl(offer.Price), image_url: item.images?.[0]?.imageUrl, images: (item.images || []).slice(0, 5).map(i => i.imageUrl),
      url: p.link || null, category: (p.categories?.[0] || '').split('/').filter(Boolean).pop() || null };
  });
}

async function woo(origin, limit) {
  const d = await getJson(`${origin}/wp-json/wc/store/v1/products?per_page=${limit}&orderby=popularity`);
  if (!Array.isArray(d)) return [];
  return d.filter(p => p.is_in_stock !== false).map(p => ({
    name: cleanName(p.name), price: p.prices?.price ? brl(Number(p.prices.price) / 10 ** (p.prices.currency_minor_unit ?? 2)) : null,
    image_url: p.images?.[0]?.src, images: (p.images || []).slice(0, 5).map(i => i.src), url: p.permalink, category: p.categories?.[0]?.name || null,
  }));
}

// Nuvemshop: a listagem /produtos/ traz os cards com dados em atributos e JSON-LD.
async function nuvemshop(origin, limit) {
  const html = await getText(`${origin}/produtos/`);
  if (!html || !/nuvemshop|tiendanube|lojavirtualnuvem/i.test(html)) return [];
  return productsFromLd(html, origin).slice(0, limit);
}

// Reserva genérica: sitemap → páginas de produto → JSON-LD Product ou metatags og.
async function fromSitemap(origin, limit) {
  const PRODUCT_URL = /(\/p$|\/p\?|\/produtos?\/|\/products?\/|\/item\/|-p-?\d+)/i;
  let urls = [];
  const queue = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`];
  for (let hop = 0; hop < 4 && queue.length && urls.length < limit * 3; hop++) {
    const xml = await getText(queue.shift(), 6000); if (!xml) continue;
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => decode(m[1]));
    if (/<sitemapindex/i.test(xml)) queue.push(...locs.sort((a, b) => /product|produto/i.test(b) - /product|produto/i.test(a)).slice(0, 3));
    else urls.push(...locs.filter(u => PRODUCT_URL.test(u)));
  }
  urls = [...new Set(urls)].slice(0, limit);
  const pages = await Promise.all(urls.map(u => getText(u, 6000).then(h => h && productsFromLd(h, u)[0]).catch(() => null)));
  return pages.filter(Boolean);
}

function productsFromLd(html, pageUrl) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let data; try { data = JSON.parse(m[1].trim()); } catch { continue; }
    const walk = o => {
      if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk);
      if (o['@graph']) walk(o['@graph']); if (o.itemListElement) walk(o.itemListElement); if (o.item) walk(o.item);
      if ([].concat(o['@type'] || []).includes('Product')) {
        const offers = [].concat(o.offers || []), off = offers[0] || {};
        const price = off.price ?? off.lowPrice ?? off.offers?.[0]?.price;
        if (/OutOfStock/i.test(off.availability || '')) return;
        const imgs = [].concat(o.image || []).map(i => typeof i === 'string' ? i : i?.url).filter(Boolean);
        out.push({ name: cleanName(o.name), price: price != null ? brl(price) : null, image_url: abs(imgs[0], pageUrl), images: imgs.slice(0, 5).map(i => abs(i, pageUrl)), url: abs(o.url || pageUrl, pageUrl), category: o.category || null });
      }
    };
    walk(data);
  }
  if (!out.length && /og:type"\s+content="product/i.test(html)) {
    const meta = k => decode((new RegExp(`(?:property|name)="${k}"\\s+content="([^"]*)"`, 'i').exec(html) || [])[1]);
    if (meta('og:title') && meta('og:image')) out.push({ name: cleanName(meta('og:title')), price: brl(meta('product:price:amount')), image_url: abs(meta('og:image'), pageUrl), images: [], url: pageUrl, category: null });
  }
  return out;
}

const abs = (u, base) => { try { return new URL(u, base).href; } catch { return null; } };
function dedupeBy(arr, key) { const seen = new Set(); return arr.filter(x => { const k = key(x); if (seen.has(k)) return false; seen.add(k); return true; }); }
