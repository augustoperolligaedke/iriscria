// LLM via API compatível com OpenAI (OpenAI, OpenRouter...). Sem chave, usa modelos de texto locais para o MVP rodar.
import { clean } from './util.js';
import { nameFromDomain } from './brand.js';
import { FUNNEL, RULES_PROMPT, enforce } from './playbook.js';
import { strategyPrompt, captionCta, normalizeStrategy } from './strategy.js';

async function chatJson(env, system, user, maxTokens = 1200) {
  if (!env.LLM_API_KEY) return null;
  const r = await fetch((env.LLM_BASE_URL || 'https://api.openai.com/v1') + '/chat/completions', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + env.LLM_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: env.LLM_MODEL || 'gpt-4.1-mini',
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  if (!r.ok) { console.error('llm', r.status, await r.text()); return null; }
  const d = await r.json();
  try { return JSON.parse(d.choices[0].message.content); } catch { return null; }
}

const BRAND_SYS = `Você é a diretora de marca da Íris, uma IA que cria conteúdo de Instagram para lojas brasileiras.
Responda somente JSON com: brand_name (nome comercial curto, sem "loja oficial" nem domínio), category ("moda", "cosmeticos", "joias", "casa" ou "outro"), tone (uma frase descrevendo o tom de voz com 3 adjetivos, em português, específica desta marca), icp (uma frase: quem compra, faixa de idade e por quê), differential (uma frase: por que comprar nesta loja e não em outra, baseada em fatos do site), occasions (ocasiões de uso do cliente, separadas por vírgula), products (até 6 itens {name, price (string ou null), image_url}), palette {primary, secondary, accent} em hex escolhidos entre as cores informadas, font (nome da fonte principal ou null).
Se site_blocked for true, o site não pôde ser lido: use o que você sabe com segurança sobre a marca pelo domínio e nome. Se não conhecer a marca, deduza a categoria pelo nome e escreva tom e público plausíveis para ela, sem inventar fatos.
Seja opinativa: escolha, não liste opções.`;

// Sem IA: tom e público por categoria, deduzida de palavras do site.
const CATEGORY = [
  ['cosmeticos', /(maquiagem|make|batom|skin ?care|s[ée]rum|perfume|cosm[ée]tic|beleza|cabelo|hidrat)/i, 'Cuidadoso, sensorial e confiante. Fala de textura, rotina e resultado sem exagero.', 'Mulheres de 20 a 40 anos que pesquisam rotina de cuidado no Instagram e compram quando entendem o benefício.'],
  ['joias', /(joia|semijoia|brinco|colar|anel|pulseira|prata|ouro|folhead)/i, 'Delicado, elegante e próximo. Valoriza detalhe, acabamento e ocasião.', 'Mulheres de 25 a 45 anos que compram para si ou para presentear e decidem pelo detalhe da peça.'],
  ['casa', /(decora|casa|cama|mesa|banho|m[óo]vel|utilidade)/i, 'Acolhedor, prático e inspirador. Mostra o produto no ambiente.', 'Pessoas de 25 a 50 anos montando ou renovando a casa, que salvam ideias e compram quando veem o produto em uso.'],
  ['moda', /(vestido|cal[çc]a|camisa|camiseta|blusa|jeans|moda|roupa|look|cole[çc][ãa]o|bermuda|t[êe]nis|sand[áa]lia)/i, 'Direto, atual e confiante. Fala de caimento, combinação e ocasião de uso.', 'Pessoas de 20 a 40 anos que acompanham a loja no Instagram e compram novidade quando veem o look completo.'],
];

export async function inferBrand(env, raw) {
  const domainName = raw.site_url ? nameFromDomain(raw.site_url) : '';
  const user = JSON.stringify({ site: raw.site_url, site_blocked: raw.error === 'blocked', domain_name_guess: domainName, site_name: raw.site_name, instagram: raw.instagram, title: raw.title, description: raw.description, headings: raw.headings.slice(0, 20), text_sample: raw.text.slice(0, 2500), colors_by_frequency: raw.colors.slice(0, 12), fonts: raw.fonts.slice(0, 5), images: raw.images.slice(0, 20) });
  const out = await chatJson(env, BRAND_SYS, user);
  if (out) return out;
  // fallback sem LLM
  const vivid = raw.colors.filter(c => saturation(c) > 0.25);
  const primary = vivid[0] || raw.colors[0] || '#1F140D';
  const accent = vivid.find(c => hueDiff(c, primary) > 40) || '#FFD83A';
  const secondary = raw.colors.find(c => lightness(c) > 0.85 && saturation(c) < 0.35) || '#FFF9EF';
  const corpus = [raw.title, raw.description, raw.headings.join(' '), raw.text.slice(0, 3000)].join(' ');
  // categoria com mais ocorrências, não a primeira que aparece
  const hits = CATEGORY.map(c => (corpus.match(new RegExp(c[1].source, 'gi')) || []).length);
  const cat = Math.max(...hits) > 0 ? CATEGORY[hits.indexOf(Math.max(...hits))] : CATEGORY[3];
  return {
    brand_name: clean(raw.title.split(/[|–\-:]/)[0], 40) || domainName || hostName(raw.site_url),
    category: cat[0], tone: cat[2], icp: cat[3],
    products: raw.images.slice(0, 6).map(i => ({ name: clean(i.alt, 60) || 'Produto', price: null, image_url: i.src })),
    palette: { primary, secondary, accent },
    font: raw.fonts[0] || null,
  };
}

const COPY_SYS = `Você é a redatora da Íris. Escreve conteúdo de Instagram para lojas brasileiras de moda e cosméticos, em português do Brasil, sem clichês, sem promessas de resultado, sem hífens decorativos. Use o tom de voz da marca e respeite a etapa de funil e as regras informadas. Responda somente JSON.`;

const SCHEMA = {
  feed: 'JSON: {hook (título da arte, até 6 palavras), body (subtítulo da arte, até 90 caracteres, um fato do produto ou preço/condição), caption (até 300 caracteres, pode ter 1 pedido de ação), hashtags (array de 4)}',
  carousel: 'JSON: {slides: 5 itens [{hook (título do slide, até 7 palavras), body (subtítulo, até 110 caracteres)}]: 1º capa que gera curiosidade, 2º a 4º detalhes, uso, combinações ou prova, 5º fecha com o produto em destaque e um motivo final (sem pedir clique); caption (até 300 caracteres, pode ter 1 pedido de ação); hashtags (array de 4)}',
  reel: 'JSON: {hook (primeira linha da legenda, até 8 palavras, desperta curiosidade, sem preço), caption (até 220 caracteres, começa pelo hook), hashtags (array de 4), video_style ("motion" para produto em estúdio ou "natural" para cena real de uso; escolha pelo produto), video_prompt (em inglês, 1 frase descrevendo só a câmera e a luz sobre o produto, sem texto na tela)}',
};

export async function writeCopy(env, { format, brand, product, offer }) {
  const f = FUNNEL[format];
  // topo de funil não carrega oferta
  const useOffer = f.stage === 'topo' ? null : offer;
  const st = normalizeStrategy(brand.strategy);
  const ctx = JSON.stringify({ format, funnel: f.stage, brand: { name: brand.name, tone: brand.tone, icp: brand.icp, instagram: brand.instagram }, product: { name: product.name, price: f.stage === 'topo' ? null : product.price, description: product.description }, offer: useOffer });
  const out = await chatJson(env, COPY_SYS, `${RULES_PROMPT(format)}\n\n${strategyPrompt(st)}\n\nContexto: ${ctx}\nGere ${SCHEMA[format]}`);
  return enforce(format, out || fallbackCopy(format, brand, product, useOffer, st), product, st);
}

function fallbackCopy(format, brand, product, offer, st = {}) {
  const p = product.name, premium = st.price_tier === 'premium', price = product.price || '', cta = captionCta(st);
  if (!offer && st.conditions && format !== 'reel') offer = premium ? null : st.conditions.split(' · ')[0];
  const hashtags = ['#' + slug(brand.name), '#novidade', '#' + slug(p), '#instashop'];
  if (format === 'feed') return { hook: p, body: (premium ? (st.differential || clean(product.description, 90)) : [price, offer].filter(Boolean).join(' · ')) || clean(product.description, 90), caption: `${p}${price ? ' por ' + price : ''}. ${offer ? offer + '. ' : ''}${premium && st.conditions ? st.conditions + '. ' : ''}${cta}`, hashtags };
  if (format === 'carousel') return {
    slides: [
      { hook: `Chegou ${p}`, body: 'O detalhe que faz diferença no dia a dia.' },
      { hook: 'O que tem de especial', body: st.differential ? clean(st.differential, 110) : product.description ? clean(product.description, 110) : 'Acabamento que aparece na foto e dura no uso.' },
      { hook: 'Para quais ocasiões', body: st.occasions ? clean(st.occasions, 110) : 'Combina com o que você já tem e resolve mais de uma ocasião.' },
      { hook: 'Para quem é', body: brand.icp ? clean(brand.icp, 110) : 'Para quem quer praticidade sem abrir mão do estilo.' },
      { hook: p, body: price ? `${price}${offer ? ' · ' + offer : ''}` : (offer || 'Disponível agora na loja.') },
    ],
    caption: `${p}${price ? ' por ' + price : ''}. ${offer ? offer + '. ' : ''}Salve para lembrar. ${cta}`, hashtags,
  };
  return { hook: `Repara nesse detalhe`, caption: `Repara nesse detalhe. ${p}, de perto.`, hashtags, video_style: 'motion', video_prompt: '' };
}

function saturation(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return 0;
  const n = parseInt(m[1], 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b); if (max === 0) return 0; return (max - min) / max;
}
const hostName = u => { try { return new URL(u).hostname.replace(/^www\./, '').split('.')[0]; } catch { return 'sua loja'; } };
const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'loja';

function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
function lightness(hex) { const [r, g, b] = rgb(hex); return (Math.max(r, g, b) + Math.min(r, g, b)) / 2; }
function hue(hex) { const [r, g, b] = rgb(hex), max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min; if (!d) return 0; let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; }
function hueDiff(a, b) { const d = Math.abs(hue(a) - hue(b)); return Math.min(d, 360 - d); }
