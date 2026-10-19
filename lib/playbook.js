// Playbook de produção da Íris: fonte única das regras de conteúdo.
// Prompt (llm.js), travas pós-IA (enforce), prompt de vídeo (generate.js) e renderizador (public/app/app.js) seguem este arquivo.
// Mudou uma regra? Mude aqui e rode `node scripts/check-playbook.mjs`.

// Funil: cada formato tem uma etapa fixa. O contexto da etapa vai para a IA.
export const FUNNEL = {
  reel: {
    stage: 'topo',
    label: 'Topo de funil · descoberta',
    goal: 'Fazer quem não conhece a loja parar de rolar e lembrar do produto. Não vende, desperta desejo.',
    voice: 'Curiosidade, estética, sensação. Nada de preço, oferta ou pedido de compra.',
  },
  carousel: {
    stage: 'meio',
    label: 'Meio de funil · consideração',
    goal: 'Quem já viu o produto entende por que ele vale: detalhes, uso, combinações, prova.',
    voice: 'Explica e convence com fatos do produto. Preço só se ajudar a decidir.',
  },
  feed: {
    stage: 'fundo',
    label: 'Fundo de funil · conversão',
    goal: 'Quem já quer o produto decide agora: produto, preço e condição claros.',
    voice: 'Direto e objetivo. Preço e oferta aparecem se existirem.',
  },
};

// Limites de texto. O que passa disso é cortado na trava, não confiado à IA.
export const LIMITS = {
  hook: { words: 6, chars: 42 },       // título da arte
  body: { chars: 90 },                  // subtítulo da arte
  slideHook: { words: 7, chars: 48 },
  slideBody: { chars: 110 },
  slides: { min: 4, max: 6 },
  caption: { chars: 320 },
  reelHook: { words: 8, chars: 60 },   // só na legenda, nunca no vídeo
  hashtags: 4,
};

// Regras de arte estática (feed e carrossel).
// Hook = título. Body = subtítulo. CTA = a própria imagem do produto, sem botão desenhado.
export const STATIC_RULES = [
  'Hook é o título da arte: curto, concreto, sem ponto de exclamação em excesso.',
  'Body é o subtítulo: complementa o hook com um fato do produto.',
  'O CTA é visual: a foto do produto em destaque faz o convite. Nunca escreva botão, "clique", "compre agora", "saiba mais", "link na bio" ou "arraste" na arte.',
  'Pedido de ação, quando existir, vai só na legenda.',
  'Nada de emoji, hashtag, @, logo ou endereço do site dentro da arte. O produto já carrega a marca.',
];

// Regras de reels: vídeo do produto, natural, quase nada na tela.
export const REEL_RULES = [
  'O vídeo mostra só o produto: motion suave ou cena natural de uso. Sem texto, legenda, logo, preço ou elementos gráficos no vídeo.',
  'Câmera calma: push-in lento, órbita curta ou luz passando. Sem cortes bruscos, sem zoom agressivo, sem efeitos.',
  'O produto não pode mudar de forma, cor, estampa ou rótulo.',
  'O gancho vai na primeira linha da legenda, não na tela.',
];

export const RULES_PROMPT = (format) => {
  const f = FUNNEL[format];
  const rules = format === 'reel' ? REEL_RULES : STATIC_RULES;
  return `Etapa: ${f.label}. Objetivo: ${f.goal} Tom: ${f.voice}\nRegras obrigatórias:\n- ${rules.join('\n- ')}`;
};

// Frases de CTA proibidas dentro da arte (feed e carrossel).
const B = '(?<![\\p{L}\\d])', E = '(?![\\p{L}\\d])';
const CTA_IN_ART = new RegExp(`${B}(clique|clica|compre( já| agora)?|compra já|saiba mais|link na bio|arraste|deslize|garanta( o seu| já)?|aproveite|chama no direct|chame no direct|confira)${E}[^.!?]*[.!?]?`, 'giu');
const NOISE = /[#@][\wÀ-ú.]+|\p{Extended_Pictographic}|(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|net|store|shop|loja)(?:\.br)?(?:\/\S*)?/giu;
// Termos de venda que não cabem no topo de funil.
const SALES = new RegExp(`(r\\$\\s?[\\d.,]+|${B}(\\d+x sem juros|frete gr[aá]tis|desconto|promo[cç][aã]o|oferta|só hoje|últimas unidades)${E})`, 'giu');

const squash = s => String(s || '').replace(/\s+/g, ' ').replace(/\s([.,!?;:])/g, '$1').trim();
const cutWords = (s, n) => s.split(' ').slice(0, n).join(' ');
const cutChars = (s, n) => { if (s.length <= n) return s; const c = s.slice(0, n); const sp = c.lastIndexOf(' '); return (sp > n * 0.6 ? c.slice(0, sp) : c).replace(/[,;:\-–]$/, '').trim(); };
const tidyEnd = s => s.replace(/[,;:\-–]+$/, '').trim();

export function artText(s, { words, chars }) {
  let t = squash(String(s || '').replace(NOISE, '').replace(CTA_IN_ART, ''));
  if (words) t = cutWords(t, words);
  if (chars) t = cutChars(t, chars);
  return tidyEnd(t);
}
const capChars = (s, n) => cutChars(squash(s), n);

// Trava pós-IA: normaliza a saída para o formato e as regras, venha de onde vier.
export function enforce(format, out, product = {}) {
  const o = out && typeof out === 'object' ? out : {};
  const fallbackHook = product.name || 'Novidade';
  if (format === 'feed') {
    return {
      hook: artText(o.hook || o.headline, LIMITS.hook) || artText(fallbackHook, LIMITS.hook),
      body: artText(o.body || o.subtitle, LIMITS.body),
      caption: capChars(o.caption, LIMITS.caption.chars),
      hashtags: tags(o.hashtags),
    };
  }
  if (format === 'carousel') {
    let slides = (Array.isArray(o.slides) ? o.slides : []).map(s => ({
      title: artText(s?.hook || s?.title, LIMITS.slideHook),
      body: artText(s?.body, LIMITS.slideBody),
    })).filter(s => s.title);
    if (!slides.length) slides = [{ title: artText(fallbackHook, LIMITS.slideHook), body: '' }];
    slides = slides.slice(0, LIMITS.slides.max);
    return { slides, caption: capChars(o.caption, LIMITS.caption.chars), hashtags: tags(o.hashtags) };
  }
  // reel: topo de funil, sem venda no gancho, sem texto no vídeo
  let hook = squash(String(o.hook || o.title || '').replace(SALES, '').replace(NOISE, '')).replace(/^[^\p{L}\d]+/u, '');
  hook = tidyEnd(cutWords(capChars(hook, LIMITS.reelHook.chars), LIMITS.reelHook.words));
  // sobrou pouco depois de tirar a venda: usa um gancho neutro com o nome do produto
  if ((hook.match(/\p{L}{3,}/gu) || []).length < 2) hook = artText(`${fallbackHook} de perto`, LIMITS.reelHook);
  return {
    hook,
    caption: capChars(o.caption, LIMITS.caption.chars),
    hashtags: tags(o.hashtags),
    video_style: o.video_style === 'natural' ? 'natural' : 'motion',
    video_prompt: videoPrompt(o.video_prompt, o.video_style),
  };
}

function tags(h) {
  const arr = Array.isArray(h) ? h : String(h || '').split(/\s+/);
  return arr.map(t => '#' + String(t).replace(/^#+/, '').replace(/[^\wÀ-ú]/g, '')).filter(t => t.length > 2).slice(0, LIMITS.hashtags);
}

// Prompt de vídeo sempre fechado com as travas, mesmo se a IA esquecer.
const VIDEO_GUARD = 'The product stays exactly as in the reference image: same shape, color, print and label. No text, no captions, no logos, no watermarks, no graphics or overlays on screen. Calm, natural movement, no fast cuts, no aggressive zoom. Vertical 9:16.';
const VIDEO_BASE = {
  motion: 'Slow cinematic push-in on the product, soft natural light, gentle shadows, shallow depth of field, clean minimal set.',
  natural: 'Natural everyday scene with the product in real use, handheld but steady camera, soft daylight, authentic and unstaged.',
};
export function videoPrompt(p, style) {
  const base = squash(p).replace(/\b(text|caption|title|logo|subtitle)s? (on|over) (the )?screen\b[^.]*\.?/gi, '') || VIDEO_BASE[style === 'natural' ? 'natural' : 'motion'];
  return `${base.replace(/\.?$/, '.')} ${VIDEO_GUARD}`;
}
