// "Íris, cria…": entende o pedido em português. Com LLM quando houver chave; sem chave, regras simples.
import { clean } from './util.js';

const OCCASIONS = /(black friday|cyber monday|natal|ano novo|dia das m[ãa]es|dia dos pais|dia dos namorados|dia das crian[çc]as|dia do cliente|dia do consumidor|13[ºo°]?|lan[çc]amento|novidade|liquida[çc][ãa]o|queima de estoque)/i;
const CONDITION = /(\d+\s*x\s*sem\s*juros|frete\s*gr[áa]tis|\d+\s*%\s*(off|de desconto)|cupom\s+\w+|leve\s*\d+\s*pague\s*\d+|s[óo]\s*(hoje|at[ée]\s*\w+))/gi;

export function parseIntentRules(text) {
  const t = String(text || '').toLowerCase();
  const formats = [];
  if (/(reels?|v[íi]deo|story)/.test(t)) formats.push('reel');
  if (/(carross?el|carousel|slides?)/.test(t)) formats.push('carousel');
  if (/(\bpost\b|\bfeed\b|est[áa]tico|arte|imagem)/.test(t)) formats.push('feed');
  if (/(completo|os tr[êe]s|todos|kit completo|campanha)/.test(t)) formats.splice(0, formats.length, 'reel', 'carousel', 'feed');
  const price = (/r\$\s?\d+(?:[.,]\d{2})?/i.exec(text) || [])[0] || null;
  const occasion = (OCCASIONS.exec(text) || [])[0] || null;
  const conds = (String(text).match(CONDITION) || []);
  const offer = clean([occasion && occasion.replace(/^\w/, c => c.toUpperCase()), ...conds].filter(Boolean).join(', '), 160) || null;
  // nome do produto: "do vestido azul", "da bolsa nova" até "para/pra/com/por/,"
  const m = /\b(?:de|do|da|dos|das|desse|dessa|desta|deste)\s+(?!um\b|uma\b)([^,.;!?]{3,60}?)(?=\s+(?:para|pra|com|por|em|na|no|que)\b|[,.;!?]|$)/i.exec(String(text).replace(/r\$\s?\d+(?:[.,]\d{2})?/gi, ''));
  let product = m ? clean(m[1], 60) : null;
  if (product && (/^(black|natal|dia|cyber|semana|instagram|celular|foto)/i.test(product) || /(reels?|carross?el|post|feed)/i.test(product))) product = null;
  return { formats: [...new Set(formats)], product_name: product, price, offer, occasion };
}

export async function parseIntent(env, text) {
  const rules = parseIntentRules(text);
  if (!env.LLM_API_KEY) return rules;
  try {
    const r = await fetch((env.LLM_BASE_URL || 'https://api.openai.com/v1') + '/chat/completions', {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { authorization: 'Bearer ' + env.LLM_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ model: env.LLM_MODEL || 'gpt-4.1-mini', temperature: 0, response_format: { type: 'json_object' }, messages: [
        { role: 'system', content: 'Extraia de um pedido de lojista brasileira para a Íris (IA de posts) um JSON: formats (array com "reel", "carousel", "feed"; vazio se não disser), product_name (string ou null), price (string "R$ ..." ou null), offer (condição comercial ou data comemorativa, ou null). Não invente.' },
        { role: 'user', content: String(text).slice(0, 600) },
      ] }),
    });
    const d = await r.json(); const o = JSON.parse(d.choices[0].message.content);
    const formats = (Array.isArray(o.formats) ? o.formats : []).filter(f => ['reel', 'carousel', 'feed'].includes(f));
    return { formats: formats.length ? formats : rules.formats, product_name: clean(o.product_name, 60) || rules.product_name, price: clean(o.price, 30) || rules.price, offer: clean(o.offer, 160) || rules.offer, occasion: rules.occasion };
  } catch { return rules; }
}
