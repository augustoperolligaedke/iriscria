// Estratégia de venda da marca: o que a IA precisa saber além da identidade (cores, fonte, tom).
// Guardada em brands.strategy (JSON). Deduzida do site no onboarding e confirmada pela loja.
import { clean } from './util.js';

export const PRICE_TIERS = { popular: 'Popular', intermediario: 'Intermediário', premium: 'Premium' };
export const CHANNELS = { whatsapp: 'WhatsApp', site: 'Site', direct: 'Direct do Instagram', loja: 'Loja física' };

export function normalizeStrategy(s = {}) {
  const o = s && typeof s === 'object' ? s : {};
  return {
    price_tier: PRICE_TIERS[o.price_tier] ? o.price_tier : null,
    differential: clean(o.differential, 200) || null,
    close_channel: CHANNELS[o.close_channel] ? o.close_channel : null,
    whatsapp: clean(o.whatsapp, 20).replace(/[^\d+]/g, '') || null,
    conditions: clean(o.conditions, 200) || null,
    occasions: clean(o.occasions, 200) || null,
    emoji: o.emoji === false ? false : true,
    avoid: clean(o.avoid, 200) || null,
  };
}

// preço em texto ("R$ 1.299,90") → número
const num = p => { const m = String(p || '').replace(/\./g, '').match(/(\d+)(?:,(\d{1,2}))?/); return m ? Number(m[1] + '.' + (m[2] || '0')) : null; };

// Dedução a partir do que o leitor do site encontrou. Tudo é sugestão: a loja confirma na tela da marca.
export function inferStrategy(raw = {}, products = [], category = 'moda', platform = null) {
  const prices = products.map(p => num(p.price)).filter(n => n > 0).sort((a, b) => a - b);
  const median = prices.length ? prices[Math.floor(prices.length / 2)] : null;
  // faixas pensadas para moda e semijoias no Brasil; acima de R$ 350 a peça típica já é premium
  const price_tier = median == null ? null : median < 120 ? 'popular' : median <= 350 ? 'intermediario' : 'premium';
  const text = [raw.description, (raw.headings || []).join(' '), raw.text].join(' ');
  const conds = [];
  const frete = /frete gr[aá]tis[^.\n|]{0,40}?(acima de|a partir de|em compras acima de)\s*R\$\s?[\d.,]+/i.exec(text) || /frete gr[aá]tis/i.exec(text);
  if (frete) conds.push(clean(frete[0], 60).replace(/[.,]+$/, '').replace(/^\w/, c => c.toUpperCase()));
  const parc = /(\d{1,2})\s*x\s*sem\s*juros/i.exec(text); if (parc) conds.push(`${parc[1]}x sem juros`);
  if (/troca (gr[aá]tis|f[aá]cil)|primeira troca gr[aá]tis/i.test(text)) conds.push('Troca fácil');
  const cupom = /cupom[^.\n]{0,30}?(\d{1,2}\s*%)/i.exec(text); if (cupom) conds.push(`${cupom[1].replace(/\s/g, '')} na primeira compra`);
  // loja com catálogo online fecha no site; sem catálogo, o link de WhatsApp do site indica onde a venda acontece
  const close_channel = platform ? 'site' : raw.whatsapp ? 'whatsapp' : raw.site_url ? 'site' : 'direct';
  const OCC = { moda: 'Trabalho, fim de semana, eventos e viagens', joias: 'Presente, dia a dia e ocasiões especiais', cosmeticos: 'Rotina de cuidado e preparação para eventos', casa: 'Renovar a casa e receber visitas' };
  return normalizeStrategy({ price_tier, close_channel, whatsapp: raw.whatsapp || null, conditions: conds.join(' · ') || null, occasions: OCC[category] || OCC.moda, differential: null, emoji: price_tier !== 'premium' });
}

// Chamada da legenda conforme onde a venda fecha. O CTA da arte continua sendo o produto (sem botão).
export function captionCta(st = {}) {
  return { whatsapp: 'Chama no WhatsApp que a gente separa o seu.', site: 'Garanta o seu pelo link da bio.', direct: 'Me chama no direct pra garantir o seu.', loja: 'Passa na loja pra experimentar.' }[st.close_channel] || 'Garanta o seu pelo link da bio.';
}

// Trecho que entra no prompt de cada post.
export function strategyPrompt(st = {}) {
  const s = normalizeStrategy(st), lines = [];
  if (s.price_tier === 'premium') lines.push('Marca premium: venda por desejo, qualidade, exclusividade e detalhe. Não destaque desconto nem parcelamento na arte; condição comercial só na legenda, discreta.');
  if (s.price_tier === 'intermediario') lines.push('Marca de preço intermediário: equilibre desejo e condição; parcelamento pode aparecer no subtítulo do feed.');
  if (s.price_tier === 'popular') lines.push('Marca popular: preço e condição claros ajudam a vender; no feed, o preço pode ir no subtítulo.');
  if (s.differential) lines.push(`Diferencial da loja (use como argumento, sobretudo no carrossel): ${s.differential}.`);
  if (s.occasions) lines.push(`Ocasiões de uso do cliente (para dar contexto ao produto): ${s.occasions}.`);
  if (s.conditions) lines.push(`Condições comerciais padrão da loja: ${s.conditions}.`);
  if (s.close_channel) lines.push(`A venda fecha por: ${CHANNELS[s.close_channel]}. O pedido de ação da legenda aponta para esse canal.`);
  if (!s.emoji) lines.push('Não use emoji.');
  if (s.avoid) lines.push(`Nunca use estas palavras ou temas: ${s.avoid}.`);
  return lines.length ? 'Estratégia de venda:\n- ' + lines.join('\n- ') : '';
}
