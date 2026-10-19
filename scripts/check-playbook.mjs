// Checa as travas do playbook contra saídas ruins de IA. Rode antes de todo deploy: node scripts/check-playbook.mjs
import { enforce, LIMITS, FUNNEL } from '../lib/playbook.js';
import { inferStrategy, captionCta, strategyPrompt } from '../lib/strategy.js';

let fail = 0;
const ok = (cond, msg) => { if (!cond) { fail++; console.error('✗', msg); } else console.log('✓', msg); };
const words = s => s.split(/\s+/).filter(Boolean).length;
const CTA = /(clique|compre|saiba mais|link na bio|arraste|deslize|garanta|confira)/i;
const prod = { name: 'Vestido Midi Linho', price: 'R$ 189' };

const feed = enforce('feed', { headline: 'Compre agora o vestido mais lindo da estação inteira! 😍', body: 'Linho puro, forro leve. Clique no link na bio! #moda @loja', caption: 'x'.repeat(500) }, prod);
ok(words(feed.hook) >= 2 && !CTA.test(feed.hook) && words(feed.hook) <= LIMITS.hook.words, `feed: hook sem CTA e curto → "${feed.hook}"`);
ok(!CTA.test(feed.body) && !/[#@]|😍/u.test(feed.body), `feed: body sem CTA, # ou @ → "${feed.body}"`);
ok(feed.caption.length > 200 && feed.caption.length <= LIMITS.caption.chars, 'feed: legenda preenchida e dentro do limite');
ok(!('button' in feed) && !('cta' in feed), 'feed: nenhum campo de botão');

const car = enforce('carousel', { slides: Array.from({ length: 9 }, (_, i) => ({ title: i === 8 ? 'Garanta o seu já' : `Detalhe ${i}`, body: 'Deslize para ver mais. Tecido que respira.' })) }, prod);
ok(car.slides.length <= LIMITS.slides.max, `carrossel: no máximo ${LIMITS.slides.max} slides`);
ok(car.slides.every(s => !CTA.test(s.title + ' ' + s.body)), 'carrossel: nenhum slide com CTA escrito');
ok(car.slides.every(s => s.title), 'carrossel: todo slide tem hook');

const reel = enforce('reel', { title: 'Promoção: R$ 189 em 3x sem juros só hoje', video_prompt: 'Product spin with title text on screen and price.' }, prod);
ok(!/r\$|sem juros|promo|só hoje/i.test(reel.hook) && (reel.hook.match(/\p{L}{3,}/gu) || []).length >= 2, `reels: gancho sem venda (topo de funil) → "${reel.hook}"`);
ok(/No text/.test(reel.video_prompt) && !/title text on screen/i.test(reel.video_prompt), 'reels: prompt de vídeo proíbe texto na tela');
ok(['motion', 'natural'].includes(reel.video_style), 'reels: estilo motion ou natural');

for (const f of ['feed', 'carousel', 'reel']) { const r = enforce(f, { caption: 'Legenda normal da loja.', slides: [{ title: 'Um dois' }] }, prod); ok(r.caption === 'Legenda normal da loja.', `${f}: legenda curta passa intacta`); }
{ const r = enforce('feed', { hook: 'Piso brilhando loja-exemplo.com.br', body: 'Seca rápido. www.loja.com.br' }, prod); ok(!/\.com/.test(r.hook + r.body), `arte sem endereço de site → "${r.hook}" / "${r.body}"`); }
{ const r = enforce('feed', { hook: 'Vestido novo', caption: 'Chegou ✨ o vestido 😍 da coleção' }, prod, { emoji: false }); ok(!/\p{Extended_Pictographic}/u.test(r.caption), `loja sem emoji: legenda limpa → "${r.caption}"`); }
{ const st = inferStrategy({ text: 'Frete grátis acima de R$ 299. Pague em 6x sem juros. Troca fácil.', site_url: 'https://x.com' }, [{ price: 'R$ 479' }, { price: 'R$ 898' }, { price: 'R$ 119,20' }]);
  ok(st.price_tier === 'premium', `mediana R$ 479 → premium (${st.price_tier})`);
  ok(/Frete grátis acima de R\$ 299/.test(st.conditions) && /6x sem juros/.test(st.conditions) && /Troca fácil/.test(st.conditions), `condições lidas do site → "${st.conditions}"`);
  ok(st.close_channel === 'site', 'loja com site fecha pelo site');
  ok(/não destaque desconto/i.test(strategyPrompt(st)), 'premium: prompt proíbe destacar desconto na arte'); }
ok(inferStrategy({ whatsapp: '5541999999999' }, [{ price: 'R$ 59,90' }]).close_channel === 'whatsapp' && inferStrategy({}, [{ price: 'R$ 59,90' }]).price_tier === 'popular', 'WhatsApp no site → fecha no WhatsApp; R$ 59,90 → popular');
ok(/WhatsApp/.test(captionCta({ close_channel: 'whatsapp' })) && /direct/.test(captionCta({ close_channel: 'direct' })), 'chamada da legenda segue o canal de venda');
const empty = ['feed', 'carousel', 'reel'].map(f => enforce(f, null, prod));
ok(empty[0].hook && empty[1].slides.length && empty[2].video_prompt, 'saída vazia da IA não quebra nenhum formato');
ok(FUNNEL.reel.stage === 'topo' && FUNNEL.carousel.stage === 'meio' && FUNNEL.feed.stage === 'fundo', 'funil: reels topo, carrossel meio, feed fundo');

if (fail) { console.error(`\n${fail} regra(s) quebrada(s).`); process.exit(1); }
console.log('\nPlaybook ok.');
