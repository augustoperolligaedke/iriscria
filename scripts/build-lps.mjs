// Landing pages de validação: um nicho e uma dor por página. Gera public/para/<slug>/index.html.
// Cada página registra visita, clique e cadastro com o próprio slug (ver scripts/lp-stats.mjs).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const LPS = [
  {
    slug: 'moda', foto: 'moda', pos: '50% 20%', kw: 'posts para loja de roupa, conteúdo para loja de moda, posts que vendem roupa, carrossel para loja de roupa, reels para loja de moda, Instagram para boutique', loja: 'atelienuvem',
    titulo: 'Íris para lojas de moda: post da peça nova no mesmo dia',
    descricao: 'Chegou coleção nova e o post ficou pra amanhã? A Íris transforma a foto da peça em post, carrossel e reels com a cara da sua loja.',
    eyebrow: 'Para lojas de moda', h1: ['Chegou peça nova', 'e o post ficou pra amanhã?'],
    lead: 'Tire a foto no cabide ou no provador. A Íris cria o post, o carrossel e o reels com as cores da sua loja em minutos. Você só ajusta e aprova pelo celular.',
    exemplo: { hook: 'Chegou: Vestido Noite', sub: 'Linho leve, do trabalho ao jantar' },
    dores: ['Fotografo as peças, mas não sobra tempo de montar o post.', 'Quando eu posto, a novidade já esfriou e a peça não sai.', 'Passo a noite no Canva e ainda fica com cara de amador.'],
    passos: [['Tire a foto', 'No cabide, no manequim ou no provador, com o celular.'], ['A Íris cria', 'Post, carrossel e reels com hook, legenda e as cores da sua marca.'], ['Você aprova', 'Ajusta o texto se quiser e baixa ou publica no mesmo dia.']],
    faq: [['Quanto tempo leva?', 'O post e o carrossel ficam prontos em cerca de dois minutos. O reels leva de 1 a 3 minutos.'], ['Preciso saber design?', 'Não. Você parte de uma criação pronta, com as cores e a fonte da sua loja, e só ajusta o texto se quiser.'], ['Funciona com foto de celular?', 'Funciona. Com boa luz e a peça inteira aparecendo, a Íris monta a arte em volta dela sem mudar cor, estampa ou modelagem.']],
  },
  {
    slug: 'semijoias', foto: 'joias', pos: '50% 45%', kw: 'posts para semijoias, foto de semijoias para Instagram, conteúdo para loja de acessórios, posts que vendem semijoias, carrossel de semijoias', loja: 'ouromiudo',
    titulo: 'Íris para semijoias: sua peça com cara de loja premium',
    descricao: 'Peça pequena em foto de celular perde brilho e detalhe. A Íris monta a arte com as cores da sua marca e coloca a peça em destaque, sem estúdio.',
    eyebrow: 'Para semijoias e acessórios', h1: ['Sua peça é linda.', 'A foto não está vendendo.'],
    lead: 'Peça pequena em foto de celular perde brilho e detalhe no feed. A Íris monta a arte com as cores da sua marca e coloca a peça em destaque, sem estúdio e sem fotógrafo.',
    exemplo: { hook: 'Anéis Coroa e Folha', sub: 'Banho dourado, para usar juntos ou sozinhos' },
    dores: ['O brinco brilha na mão, mas na foto fica apagado.', 'Estúdio e fotógrafo para cada coleção não cabem no caixa.', 'Meu feed não parece de loja premium, mesmo vendendo peça boa.'],
    passos: [['Fotografe a peça', 'No balcão ou na mão, com o celular e luz de janela.'], ['A Íris valoriza', 'Arte com as cores da sua marca, hook curto e a peça como destaque.'], ['Você posta', 'Aprova, baixa ou publica. Carrossel e reels saem da mesma foto.']],
    faq: [['A Íris edita a foto da peça?', 'A Íris não altera a peça: cor, pedra e formato continuam como na sua foto. Ela monta a arte em volta, com as cores e a fonte da sua marca.'], ['Que foto funciona melhor?', 'Peça bem iluminada, de preferência com luz natural e fundo liso. Pode ser na mão ou no balcão.'], ['Serve para kits e conjuntos?', 'Serve. Você pode mandar a foto do kit e pedir um carrossel mostrando cada peça.']],
  },
  {
    slug: 'lojistas', foto: 'beleza', pos: '50% 55%', kw: 'social media barato, criar posts com IA, posts para Instagram de loja, alternativa a social media, conteúdo para lojistas', loja: 'botanicalis',
    titulo: 'Íris: conteúdo de loja grande a partir de R$ 59 por mês',
    descricao: 'Pagar social media e fotógrafo todo mês pesa no caixa. A Íris cria post, carrossel e reels da sua loja a partir da foto do produto.',
    eyebrow: 'Para lojas que vendem no Instagram', h1: ['Conteúdo de loja grande,', 'a partir de R$ 59 por mês.'],
    lead: 'Social media, fotógrafo e designer todo mês pesam no caixa. A Íris cria post, carrossel e reels a partir da foto do produto, com a cara da sua loja, sem esperar ninguém.',
    exemplo: { hook: 'Pó compacto iluminador', sub: 'Acabamento natural que dura o dia todo' },
    dores: ['Pago freelancer e ainda espero dias pela arte.', 'Quando o freelancer some, meu Instagram para.', 'Gasto mais com conteúdo do que com estoque novo.'],
    passos: [['Mande a foto', 'Do produto, tirada no celular, ou puxe direto do seu site.'], ['A Íris cria', 'Post, carrossel e reels com hook, legenda e as cores da sua marca.'], ['Você decide', 'Aprova, ajusta e publica quando quiser. Sem fila, sem retrabalho.']],
    faq: [['Quanto custa?', 'Tem plano grátis com 2 posts por mês. Os pagos começam em R$ 59 por mês, com Pix ou cartão, sem fidelidade.'], ['Substitui meu social media?', 'Para a produção de posts do dia a dia, sim. Estratégia e atendimento continuam com você ou com quem você já tem.'], ['E se eu não gostar?', 'Você vê o resultado antes de pagar qualquer coisa. Se não parecer a sua loja, não custou nada.']],
  },
];

const head = readFileSync('src/head.html', 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CSS = `<style>
.lp-top{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;align-items:center;padding:12px max(16px,4vw);background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px)}
.lp-brand{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:20px;text-decoration:none;color:inherit}.lp-brand img{width:32px;height:32px;border-radius:9999px}
.lp-hero{padding-top:24px}
.lp-post{margin:0 auto;max-width:380px;background:#fff;color:#0c0c0c;border-radius:16px;overflow:hidden;border:1px solid #dbdbdb;box-shadow:0 32px 64px -32px rgba(0,0,0,.5);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.lp-post-top{display:flex;align-items:center;gap:10px;padding:10px 12px;font-size:14px}.lp-post-top i{width:30px;height:30px;border-radius:9999px;background:conic-gradient(#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75)}
.lp-img{position:relative;aspect-ratio:4/5}.lp-img img{width:100%;height:100%;object-fit:cover;display:block}
.lp-band{position:absolute;left:0;right:0;bottom:0;padding:20px 22px;background:#1F140D;color:#fff;display:grid;gap:6px}.lp-band b{font-size:26px;line-height:1.05;letter-spacing:-.02em}.lp-band span{font-size:14px;opacity:.85}
.lp-tag{position:absolute;top:10px;left:10px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;padding:3px 8px;border-radius:9999px}
.lp-cap{padding:10px 12px 14px;font-size:13px;line-height:18px}
.lp-pains{display:grid;gap:12px}@media(min-width:800px){.lp-pains{grid-template-columns:repeat(3,1fr)}}
.lp-pain{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:22px;font-size:18px;line-height:26px;font-weight:600}.lp-pain::before{content:"“";display:block;font-size:42px;line-height:24px;color:var(--primary)}
.lp-steps{display:grid;gap:12px}@media(min-width:800px){.lp-steps{grid-template-columns:repeat(3,1fr)}}
.lp-step{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:22px;display:grid;gap:8px}.lp-step b{font-size:18px}.lp-step span{color:var(--ink-2)}
.lp-step i{width:32px;height:32px;border-radius:9999px;display:grid;place-items:center;background:var(--primary);color:#fff;font-style:normal;font-weight:700}
.lp-foot{padding:32px max(16px,4vw);display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;color:var(--ink-2);font-size:14px}.lp-foot a{color:inherit}
</style>`;

const form = (id, lp) => `<form class="hero-cta" id="${id}-form" novalidate>
        <div class="hero-form"><label class="sr" for="${id}-loja">Site da sua loja (opcional)</label>
          <input class="input" id="${id}-loja" name="loja" type="text" inputmode="url" autocomplete="url" autocapitalize="none" spellcheck="false" placeholder="Site da loja (opcional)">
          <button class="btn btn-primary" type="submit"><span class="spin" aria-hidden="true"></span><span>Criar meu primeiro post grátis</span></button></div>
        <ul class="checks" aria-label="Condições"><li><svg aria-hidden="true"><use href="#i-check"/></svg>2 posts grátis</li><li><svg aria-hidden="true"><use href="#i-check"/></svg>Sem cartão</li></ul>
        <p class="hint" id="${id}-hint" aria-live="polite"></p></form>`;

// ícone de check usado pelo CSS do site (o sprite completo fica no body principal)
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5 10 17l9-10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol></svg>`;

const script = lp => `<script>
(function(){
var LP=${JSON.stringify(lp)};
function ev(e){try{var b=JSON.stringify({etapa:'evento',evento:e,lp:LP});if(navigator.sendBeacon){navigator.sendBeacon('/api/lead',new Blob([b],{type:'application/json'}))}else{fetch('/api/lead',{method:'POST',headers:{'content-type':'application/json'},body:b,keepalive:true})}}catch(x){}}
try{if(!sessionStorage.getItem('iris-lp-v-'+LP)){sessionStorage.setItem('iris-lp-v-'+LP,'1');ev('visita')}}catch(x){ev('visita')}
function wire(id){var f=document.getElementById(id+'-form'),i=document.getElementById(id+'-loja'),h=document.getElementById(id+'-hint'),b=f.querySelector('button');
f.addEventListener('submit',function(e){e.preventDefault();var v=i.value.trim().replace(/^https?:\\/\\//,'').replace(/\\/$/,'');
if(v&&!/\\.[a-z]{2,}/i.test(v)){h.textContent='Cole o endereço do site, como sualoja.com.br, ou deixe em branco.';i.focus();return}
b.setAttribute('aria-busy','true');ev('clique');try{sessionStorage.setItem('iris-lp',LP)}catch(x){}
var go=function(){location.href='/app/#/start?lp='+LP+(v?'&loja='+encodeURIComponent(v):'')};
if(!v){setTimeout(go,150);return}
fetch('/api/lead',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({loja:v,etapa:'loja',lp:LP,origem:location.href})}).then(go,go)})}
wire('hero');wire('fim');
})();
</script>`;

for (const p of LPS) {
  const h = head.replace(/<title>[^<]*<\/title>/, `<title>${esc(p.titulo)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(p.descricao)}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(p.descricao)}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${esc(p.titulo)}"`)
    .replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${esc(p.titulo)}"`)
    .replace(/(<meta name="twitter:description" content=")[^"]*"/, `$1${esc(p.descricao)}"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1https://iriscria.pages.dev/para/${p.slug}"`)
    .replace(/(<meta name="keywords" content=")[^"]*"/, `$1${esc(p.kw)}"`)
    .replace(/<link rel="canonical"[^>]*>\n?/, '');
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${h}
<link rel="canonical" href="https://iriscria.pages.dev/para/${p.slug}">
${CSS}
</head>
<body>
${SPRITE}
<header class="lp-top"><a class="lp-brand" href="/"><img src="/assets/iris-mark.png" alt="" width="32" height="32">Íris</a><a class="btn btn-primary btn-sm" href="#comecar">Testar grátis</a></header>
<main>
<section class="hero lp-hero" id="top">
  <div class="wrap hero-grid">
    <div class="stack" style="gap:24px">
      <span class="eyebrow">${esc(p.eyebrow)}</span>
      <h1>${esc(p.h1[0])}<br>${esc(p.h1[1])}</h1>
      <p class="lead">${esc(p.lead)}</p>
      ${form('hero', p.slug)}
    </div>
    <figure class="lp-post" aria-label="Exemplo de post criado pela Íris">
      <div class="lp-post-top"><i></i><b>${esc(p.loja)}</b></div>
      <div class="lp-img"><img src="/assets/photos/${p.foto}.jpg" alt="" loading="eager" style="object-position:${p.pos}"><span class="lp-tag">Exemplo</span><div class="lp-band"><b>${esc(p.exemplo.hook)}</b><span>${esc(p.exemplo.sub)}</span></div></div>
      <figcaption class="lp-cap"><b>${esc(p.loja)}</b> ${esc(p.exemplo.hook)}. ${esc(p.exemplo.sub)}.</figcaption>
    </figure>
  </div>
</section>
<section class="section"><div class="wrap stack" style="gap:24px">
  <h2 class="h2">Você se reconhece?</h2>
  <div class="lp-pains">${p.dores.map(d => `<p class="lp-pain">${esc(d)}</p>`).join('')}</div>
</div></section>
<section class="section" style="background:var(--surface-2)"><div class="wrap stack" style="gap:24px">
  <h2 class="h2">Como a Íris resolve</h2>
  <div class="lp-steps">${p.passos.map(([t, d], i) => `<div class="lp-step"><i>${i + 1}</i><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('')}</div>
</div></section>
<section class="section"><div class="wrap stack" style="gap:24px">
  <h2 class="h2">Perguntas frequentes</h2>
  <div class="faq">${p.faq.map(([q, a]) => `<details><summary><span class="q">${esc(q)}</span></summary><div class="a"><p>${esc(a)}</p></div></details>`).join('')}</div>
</div></section>
<section class="section" id="comecar" style="background:var(--surface-2)"><div class="wrap stack" style="gap:20px;max-width:720px">
  <h2 class="h2">Teste com uma foto sua. Leva dois minutos.</h2>
  <p class="lead">Mande a foto de um produto. Se tiver site, cole o endereço e a Íris puxa suas cores e seu catálogo. Seu primeiro carrossel e reels saem na hora, de graça.</p>
  ${form('fim', p.slug)}
</div></section>
</main>
<footer class="lp-foot"><span>© 2026 Íris · iriscria</span><nav aria-label="Rodapé" style="display:flex;gap:16px"><a href="/">Site</a><a href="/#precos">Planos</a><a href="/privacidade">Privacidade</a><a href="/termos">Termos</a></nav></footer>
${script(p.slug)}
</body>
</html>
`;
  mkdirSync(`public/para/${p.slug}`, { recursive: true });
  writeFileSync(`public/para/${p.slug}/index.html`, html);
}
console.log('landing pages:', LPS.map(p => '/para/' + p.slug).join(', '));
