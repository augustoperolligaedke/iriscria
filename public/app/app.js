/* Íris app: onboarding, criação, aprovação e download. Vanilla JS, sem build. */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s), $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const main = $('#main'), top = $('#top');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FONTS = ['Manrope', 'Poppins', 'Montserrat', 'DM Sans', 'Nunito', 'Playfair Display', 'DM Serif Display', 'Lora', 'Cormorant Garamond', 'Bebas Neue'];
  const FORMAT = { feed: 'Post no feed', carousel: 'Carrossel', reel: 'Reels' };
  let me = null;

  /* ---------- infra ---------- */
  async function api(path, opts = {}) {
    const r = await fetch('/api' + path, { headers: { 'content-type': 'application/json', ...(opts.headers || {}) }, ...opts, body: opts.body && typeof opts.body !== 'string' && !(opts.body instanceof Blob) ? JSON.stringify(opts.body) : opts.body });
    let d = null; try { d = await r.json(); } catch { }
    if (!r.ok || !d || d.ok === false) { const e = new Error(d?.message || 'Algo deu errado. Tente de novo.'); e.code = d?.error || r.status; e.status = r.status; throw e; }
    return d;
  }
  let toastT; function toast(msg, ms = 3200) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, ms); }
  const ss = { get: k => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch { } }, del: k => { try { sessionStorage.removeItem(k); } catch { } } };
  const busy = (btn, on) => { if (btn) btn.setAttribute('aria-busy', on ? 'true' : 'false'); };
  async function loadMe() { me = (await api('/me')); return me; }
  const fmtDate = s => new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  /* ---------- roteador ---------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, '') || 'home';
    const [path, qs] = h.split('?'); const q = new URLSearchParams(qs || '');
    const parts = path.split('/');
    return { name: parts[0] || 'home', id: parts[1], q };
  }
  async function render() {
    const r = route();
    try {
      if (!me) await loadMe();
      const authed = !!me.user;
      top.hidden = !authed || !me.brand || ['start', 'login'].includes(r.name);
      document.body.classList.toggle('has-shell', !top.hidden);
      const tab = r.name === 'plano' ? 'conta' : r.name === 'content' ? 'conteudos' : r.name;
      $$('.tabs a').forEach(a => a.setAttribute('aria-current', a.dataset.tab === tab ? 'page' : 'false'));
      if (!top.hidden) sideInfo();
      if (r.q.get('pago') && !render.paid) { render.paid = true; toast('Pagamento recebido. Liberando seu plano…', 5000); setTimeout(async () => { await loadMe(); render.paid = false; render(); }, 5000); }
      if (r.name === 'start') return viewStart(r);
      if (r.name === 'login') return viewLogin(r);
      if (!authed) { location.hash = '#/start'; return; }
      if (!me.brand && r.name !== 'conta') { location.hash = '#/start'; return; }
      if (r.name === 'home') return viewHome(r);
      if (r.name === 'conteudos') return viewContents(r);
      if (r.name === 'create') return viewCreate(r);
      if (r.name === 'content' && r.id) return viewContent(r);
      if (r.name === 'plano') return viewPlan(r);
      if (r.name === 'conta') return viewAccount(r);
      location.hash = '#/home';
    } catch (e) { console.error(e); main.innerHTML = `<div class="card"><h2>Não carregou.</h2><p class="lead">${esc(e.message)}</p><button class="btn btn-primary" onclick="location.reload()">Tentar de novo</button></div>`; }
  }
  window.addEventListener('hashchange', render);

  /* ---------- onboarding ---------- */
  const ONB = { get: () => { try { return JSON.parse(ss.get('iris-onb') || '{}'); } catch { return {}; } }, set: o => ss.set('iris-onb', JSON.stringify(o)) };
  function stepsBar(n) { return `<div class="steps">${[1, 2, 3, 4].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`; }

  async function viewStart(r) {
    const o = ONB.get();
    const loja = r.q.get('loja') || ss.get('iris-loja') || o.store || '';
    if (loja && !o.store) { o.store = loja; ONB.set(o); }
    if (me.user && me.brand && !o.step) { location.hash = '#/home'; return; }
    const step = o.step || (o.store ? 'analyze' : 'store');
    if (r.q.get('ig')) igToast(r.q.get('ig'));
    if (r.q.get('google')) googleToast(r.q.get('google'));
    if (step === 'store') return stepStore(o);
    if (step === 'analyze') return stepAnalyze(o);
    if (step === 'brand') return stepBrand(o);
    if (step === 'product') return stepProduct(o);
    if (step === 'auth') return stepAuth(o);
    if (step === 'generate') return stepGenerate(o);
    if (step === 'offer') return stepOffer(o);
    if (step === 'result') return stepResult(o);
    if (step === 'instagram') return stepInstagram(o, r);
  }
  function stepStore(o) {
    main.innerHTML = `<img class="mark" src="/assets/iris-mark.png" alt="">
      <div class="stack center"><h1>Vamos criar seu primeiro post.</h1><p class="lead">Leva dois minutos. Escolha como começar.</p></div>
      <div class="start-opts">
        <button class="start-opt on" type="button" data-opt="foto"><b>Começar com uma foto</b><span>Mande a foto de uma peça. As cores da marca saem da foto.</span></button>
        <button class="start-opt" type="button" data-opt="site"><b>Tenho site ou loja virtual</b><span>Eu leio logo, cores, fonte e o catálogo com preços.</span></button>
      </div>
      <form class="card" id="f">
        <div class="field" id="f-foto"><label for="name">Nome da loja</label><input class="input" id="name" placeholder="Ex.: Closet da Ju" autocomplete="organization" value="${esc(o.brand?.name || '')}"></div>
        <div class="field" id="f-site" hidden><label for="site">Site da loja</label><input class="input" id="site" placeholder="sualoja.com.br" inputmode="url" autocapitalize="none" value="${esc(/\./.test(o.store || '') ? o.store : '')}"></div>
        <p class="hint" id="h"></p>
        <button class="btn btn-primary btn-block" type="submit"><span class="spin"></span>Continuar</button></form>
      ${me.user ? '' : '<p class="micro center">Já tem conta? <a href="#/login">Entrar</a></p>'}`;
    let opt = /\./.test(o.store || '') ? 'site' : 'foto';
    const setOpt = v => { opt = v; $$('.start-opt').forEach(x => x.classList.toggle('on', x.dataset.opt === v)); $('#f-foto').hidden = v !== 'foto'; $('#f-site').hidden = v !== 'site'; (v === 'site' ? $('#site') : $('#name')).focus(); };
    $$('.start-opt').forEach(x => x.onclick = () => setOpt(x.dataset.opt)); setOpt(opt);
    $('#f').onsubmit = e => { e.preventDefault();
      if (opt === 'site') { const v = $('#site').value.trim(); if (!/\.[a-z]{2,}/i.test(v)) { $('#h').textContent = 'Cole o endereço do site, como sualoja.com.br.'; return; } ONB.set({ ...o, store: v, step: 'analyze' }); return render(); }
      const name = $('#name').value.trim(); if (name.length < 2) { $('#h').textContent = 'Digite o nome da loja.'; return; }
      // sem site: a marca começa do nome, as cores saem da foto do produto e a estratégia é confirmada na próxima tela
      ONB.set({ ...o, store: '', brand: { name, colors: { primary: '#1F140D', secondary: '#FFFFFF', accent: '#FFD83A' }, font: 'Manrope', tone: '', icp: '', strategy: { close_channel: 'whatsapp', emoji: true } }, products: [], meta: { colors_from_photo: true, no_site: true }, step: 'brand' }); render(); };
  }

  async function stepAnalyze(o) {
    main.innerHTML = `<img class="mark" src="/assets/iris-mark.png" alt="">${stepsBar(1)}
      <div class="stack center"><h1>Lendo ${esc(o.store)}</h1><p class="lead" id="msg">Procurando cores, fonte, fotos e o jeito de falar da sua loja.</p><div class="progress"><i id="bar"></i></div></div>`;
    const msgs = ['Lendo as páginas da loja', 'Separando as cores da marca', 'Descobrindo a fonte', 'Encontrando fotos de produto', 'Entendendo o tom de voz e quem compra'];
    let i = 0; const tm = setInterval(() => { i = Math.min(i + 1, msgs.length - 1); $('#msg').textContent = msgs[i] + '…'; $('#bar').style.width = (15 + i * 18) + '%'; }, 1400);
    try {
      const d = await api('/brand/analyze', { method: 'POST', body: { store: o.store, instagram: o.ig_handle || undefined } });
      const pal = await logoPalette(d.meta?.logo_candidates || [], d.meta?.site_bg, d.meta?.colors_found || []).catch(() => null);
      if (pal) { d.brand.colors = pal.colors; d.brand.logo_url = pal.logo; d.meta.colors_from = pal.from; } else d.meta.colors_from_photo = true;
      clearInterval(tm);
      ONB.set({ ...o, brand: d.brand, products: d.products, meta: d.meta, step: 'brand' }); render();
    } catch (e) { clearInterval(tm); ONB.set({ ...o, brand: { name: '', colors: { primary: '#1F140D', secondary: '#FFF9EF', accent: '#FFD83A' }, font: 'Manrope', tone: '', icp: '' }, products: [], meta: { site_error: e.message }, step: 'brand' }); render(); }
  }

  /* ---------- cores da marca a partir do logo e do fundo do site ---------- */
  const hex = (r, g, b) => '#' + [r, g, b].map(n => Math.round(n).toString(16).padStart(2, '0')).join('');
  const toRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d) return [0, 0, l]; const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, s, l]; };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  function loadImg(url) {
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = /^(data:|blob:|\/)/.test(url) || url.startsWith(location.origin) ? url : '/api/img?u=' + encodeURIComponent(url); setTimeout(rej, 8000); });
  }
  async function logoPalette(candidates, siteBg, siteColors) {
    for (const url of candidates) {
      let im; try { im = await loadImg(url); } catch { continue; }
      const S = 96, cv = document.createElement('canvas'); cv.width = cv.height = S;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      const w = im.naturalWidth || S, h = im.naturalHeight || S, k = S / Math.max(w, h);
      ctx.drawImage(im, (S - w * k) / 2, (S - h * k) / 2, w * k, h * k);
      let px; try { px = ctx.getImageData(0, 0, S, S).data; } catch { continue; }
      // fundo próprio do logo: cantos opacos e iguais
      const corner = [[1, 1], [S - 2, 1], [1, S - 2], [S - 2, S - 2]].map(([x, y]) => { const i = (y * S + x) * 4; return px[i + 3] > 200 ? [px[i], px[i + 1], px[i + 2]] : null; });
      const logoBg = corner.every(c => c && dist(c, corner[0]) < 30) ? corner[0] : null;
      const buckets = new Map();
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] < 200) continue;
        const c = [px[i], px[i + 1], px[i + 2]];
        if (logoBg && dist(c, logoBg) < 40) continue;
        const key = c.map(v => v >> 4).join(',');
        const b = buckets.get(key) || { n: 0, sum: [0, 0, 0] }; b.n++; b.sum = b.sum.map((v, j) => v + c[j]); buckets.set(key, b);
      }
      const cols = [...buckets.values()].filter(b => b.n > 12).map(b => ({ n: b.n, rgb: b.sum.map(v => v / b.n) }));
      if (!cols.length) continue;
      cols.forEach(c => { const [, sat, l] = hsl(c.rgb); c.score = c.n * (l > 0.94 ? 0.05 : 0.4 + sat); });
      cols.sort((a, b) => b.score - a.score);
      const primary = cols[0].rgb, total = cols.reduce((t, c) => t + c.n, 0);
      let bg = siteBg ? toRgb(siteBg) : logoBg && dist(logoBg, primary) > 60 ? logoBg : [255, 255, 255];
      // borda suavizada do logo gera tons entre a cor e o fundo (ou transparente): não são cores da marca
      const blend = c => [logoBg || [255, 255, 255], [255, 255, 255], [0, 0, 0], bg].some(b => { for (let t = 0.1; t < 1; t += 0.1) if (dist(c, mix(primary, b, t)) < 28) return true; return false; });
      let accent = cols.find(c => c !== cols[0] && c.n > total * 0.06 && dist(c.rgb, primary) > 70 && !blend(c.rgb) && hsl(c.rgb)[2] < 0.94)?.rgb;
      // CSS do site só ajuda quando o logo é neutro (preto, cinza); com logo colorido, o CSS costuma trazer cor padrão da plataforma
      const PLATFORM_DEFAULTS = /^#(0366dd|0252b8|bfdbfe|9ca3af|3b82f6|2563eb|1d4ed8|007bff|0d6efd|95bf47|008060)$/i;
      if (!accent && hsl(primary)[1] < 0.35) accent = siteColors.filter(c => !PLATFORM_DEFAULTS.test(c)).map(toRgb).find(c => hsl(c)[1] > 0.3 && dist(c, primary) > 90);
      if (!accent) accent = hsl(primary)[1] > 0.35 ? [17, 17, 17] : hsl(primary)[2] < 0.3 ? mix(primary, [255, 255, 255], 0.55) : mix(primary, [0, 0, 0], 0.5);
      if (dist(bg, primary) < 60) bg = hsl(primary)[2] > 0.5 ? [20, 20, 20] : [255, 255, 255];
      return { logo: url, from: siteBg ? 'logo e fundo do site' : 'logo', colors: { primary: hex(...primary), secondary: hex(...bg), accent: hex(...accent) } };
    }
    return null;
  }
  // Foto de produto (sem logo): principal = cor do produto no centro, fundo = bordas da foto, destaque = terceira cor que sobrar.
  async function photoPalette(url) {
    const im = await loadImg(url), S = 96, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(im, 0, 0, S, S);
    const px = ctx.getImageData(0, 0, S, S).data, at = (x, y) => { const i = (y * S + x) * 4; return [px[i], px[i + 1], px[i + 2]]; };
    const groups = pts => { const m = new Map(); pts.forEach(c => { const k = c.map(v => v >> 5).join(); const g = m.get(k) || { n: 0, sum: [0, 0, 0] }; g.n++; g.sum = g.sum.map((v, j) => v + c[j]); m.set(k, g); }); return [...m.values()].map(g => ({ n: g.n, rgb: g.sum.map(v => v / g.n) })).sort((a, b) => b.n - a.n); };
    const edge = [], center = [], all = [];
    for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) { const c = at(x, y); all.push(c); if (x < 8 || y < 8 || x > S - 9) edge.push(c); if (x > S * .3 && x < S * .7 && y > S * .25 && y < S * .8) center.push(c); }
    let bg = groups(edge)[0].rgb;
    const prod = groups(center).find(g => dist(g.rgb, bg) > 60) || groups(center)[0];
    const primary = prod.rgb;
    let accent = groups(all).find(g => g.n > all.length * 0.04 && dist(g.rgb, bg) > 60 && dist(g.rgb, primary) > 60)?.rgb;
    if (hsl(bg)[2] < 0.75) bg = mix(bg, [255, 255, 255], 0.85);           // fundo sempre claro e legível
    if (!accent) accent = hsl(primary)[2] < 0.3 ? mix(primary, [255, 255, 255], 0.55) : mix(primary, [0, 0, 0], 0.5);
    return { logo: null, from: 'foto do produto', colors: { primary: hex(...primary), secondary: hex(...bg), accent: hex(...accent) } };
  }
  function brandForm(b, meta, full = false) {
    const c = b.colors || {}, st = b.strategy || {};
    const tiers = [['popular', 'Popular'], ['intermediario', 'Intermediário'], ['premium', 'Premium']], chans = [['whatsapp', 'WhatsApp'], ['site', 'Site'], ['direct', 'Direct'], ['loja', 'Loja física']];
    return `<div class="stack">
      ${meta?.site_error === 'blocked' ? `<p class="micro">O site da loja bloqueia leitura automática. Peguei nome e cores pelo logo público. Confira o resto.</p>` : meta?.site_error ? `<p class="micro">Não consegui ler o site (${esc(meta.site_error)}). Confira o que preenchi.</p>` : ''}
      ${meta?.site_guessed ? `<p class="micro">Achei o site da loja pelo @ e usei ele para logo, cores e produtos.</p>` : ''}
      ${meta?.need_site || meta?.no_site ? `<div class="card" style="padding:12px"><p class="micro" style="margin-top:0">Tem site? Cole aqui e eu puxo logo, cores e produtos com preço. Se não tem, siga: você manda a foto no próximo passo.</p><div class="row" style="gap:8px"><input class="input" id="b-site" placeholder="sualoja.com.br" inputmode="url" autocapitalize="none" style="flex:1"><button class="btn btn-ghost btn-sm" type="button" id="b-site-go">Puxar do site</button></div></div>` : ''}
      <div class="logo-row">${b.logo_url ? `<img src="/api/img?u=${encodeURIComponent(b.logo_url)}" alt="" onerror="this.remove()">` : ''}<div class="field" style="flex:1"><label for="b-name">Nome da marca</label><input class="input" id="b-name" value="${esc(b.name || '')}" placeholder="Nome da loja"></div></div>
      <div class="field"><span class="lbl">Cores</span>${meta?.colors_from ? `<p class="micro">Tiradas do ${esc(meta.colors_from)}.</p>` : meta?.colors_from_photo ? '<p class="micro">Vou tirar as cores da foto do produto no próximo passo. Se preferir, escolha agora.</p>' : ''}<div class="row" style="gap:16px">
        <label class="swatch"><input type="color" id="c-primary" value="${esc(c.primary || '#1F140D')}"><span>Principal</span></label>
        <label class="swatch"><input type="color" id="c-secondary" value="${esc(c.secondary || '#FFF9EF')}"><span>Fundo</span></label>
        <label class="swatch"><input type="color" id="c-accent" value="${esc(c.accent || '#FFD83A')}"><span>Destaque</span></label></div></div>
      <fieldset class="sell"><legend>Como você vende</legend>${meta?.no_site ? '' : '<p class="micro">Preenchi pelo que vi no site. Confira, isso muda o jeito de cada post vender.</p>'}
        <div class="field"><span class="lbl">Faixa de preço</span><div class="chips" id="st-tier">${tiers.map(([k, l]) => `<button class="chip" type="button" data-tier="${k}" aria-pressed="${st.price_tier === k}">${l}</button>`).join('')}</div></div>
        <div class="field"><label for="st-diff">Por que comprar com você</label><input class="input" id="st-diff" value="${esc(st.differential || '')}" placeholder="Ex.: estampas autorais e troca fácil"></div>
        <div class="field"><span class="lbl">Onde a venda fecha</span><div class="chips" id="st-chan">${chans.map(([k, l]) => `<button class="chip" type="button" data-chan="${k}" aria-pressed="${st.close_channel === k}">${l}</button>`).join('')}</div>
          <input class="input" id="st-wa" value="${esc(st.whatsapp || '')}" placeholder="WhatsApp da loja, com DDD" inputmode="tel" ${st.close_channel === 'whatsapp' ? '' : 'hidden'}></div>
        <div class="field"><label for="st-cond">Condições que você sempre oferece</label><input class="input" id="st-cond" value="${esc(st.conditions || '')}" placeholder="Ex.: 3x sem juros · frete grátis acima de R$ 199"></div>
        ${full ? `<div class="field"><label for="st-occ">Ocasiões de uso das suas clientes</label><input class="input" id="st-occ" value="${esc(st.occasions || '')}" placeholder="Ex.: trabalho, festa, praia"></div>
        <div class="field"><label for="st-avoid">Palavras ou temas que a marca nunca usa</label><input class="input" id="st-avoid" value="${esc(st.avoid || '')}" placeholder="Ex.: barato, promoção relâmpago"></div>
        <label class="row" style="gap:10px;font-size:15px"><input type="checkbox" id="st-emoji" ${st.emoji === false ? '' : 'checked'}> Pode usar emoji nas legendas</label>` : ''}
      </fieldset>
      <div class="field"><label for="b-font">Fonte</label><select class="input" id="b-font">${[...new Set([b.font, ...FONTS].filter(Boolean))].map(f => `<option ${f === b.font ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></div>
      <div class="field"><label for="b-tone">Tom de voz</label><textarea class="input" id="b-tone" placeholder="Ex.: próximo, direto e confiante">${esc(b.tone || '')}</textarea></div>
      <div class="field"><label for="b-icp">Quem compra</label><textarea class="input" id="b-icp" placeholder="Ex.: mulheres de 25 a 40 que seguem a loja e compram por impulso quando veem novidade">${esc(b.icp || '')}</textarea></div>
      <div class="field"><label for="b-ig">Instagram</label><input class="input" id="b-ig" value="${esc(b.instagram || '')}" placeholder="@sualoja" autocapitalize="none"></div>
    </div>`;
  }
  function bindBrandForm() {
    $$('[data-tier]').forEach(x => x.onclick = () => $$('[data-tier]').forEach(y => y.setAttribute('aria-pressed', String(y === x))));
    $$('[data-chan]').forEach(x => x.onclick = () => { $$('[data-chan]').forEach(y => y.setAttribute('aria-pressed', String(y === x))); $('#st-wa').hidden = x.dataset.chan !== 'whatsapp'; });
  }
  function readStrategy(b) {
    const v = id => $(id)?.value.trim() || null, prev = b.strategy || {};
    return { ...prev, price_tier: $('[data-tier][aria-pressed="true"]')?.dataset.tier || null, differential: v('#st-diff'), close_channel: $('[data-chan][aria-pressed="true"]')?.dataset.chan || null, whatsapp: v('#st-wa'), conditions: v('#st-cond'),
      ...($('#st-occ') ? { occasions: v('#st-occ'), avoid: v('#st-avoid'), emoji: $('#st-emoji').checked } : {}) };
  }
  function readBrandForm(b) {
    return { ...b, strategy: readStrategy(b), name: $('#b-name').value.trim(), colors: { primary: $('#c-primary').value, secondary: $('#c-secondary').value, accent: $('#c-accent').value }, font: $('#b-font').value, tone: $('#b-tone').value.trim(), icp: $('#b-icp').value.trim(), instagram: $('#b-ig').value.trim().replace(/^@/, '') };
  }
  function stepBrand(o) {
    main.innerHTML = `${stepsBar(2)}<div class="stack"><span class="eyebrow">Sua marca</span><h1>Foi isso que eu entendi.</h1><p class="lead">Confira e ajuste. Vou usar em todo conteúdo.</p></div>
      <form class="card" id="f">${brandForm(o.brand, o.meta)}<button class="btn btn-primary btn-block" type="submit">Isso é a minha marca</button><button class="btn btn-ghost btn-block" type="button" id="back">Voltar</button></form>`;
    bindBrandForm();
    $('#f').onsubmit = e => { e.preventDefault(); const nb = readBrandForm(o.brand); const norm = c => ['primary', 'secondary', 'accent'].map(k => String(c?.[k] || '').toLowerCase()).join(), same = norm(nb.colors) === norm(o.brand.colors);
      ONB.set({ ...o, brand: { ...nb, colors_pending: !!o.meta?.colors_from_photo && same }, step: 'product' }); render(); };
    $('#back').onclick = () => { ONB.set({ store: '' }); render(); };
    if ($('#b-site-go')) $('#b-site-go').onclick = () => { const v = $('#b-site').value.trim(); if (v.length < 4) { $('#b-site').focus(); return; } ONB.set({ store: v, ig_handle: o.brand?.instagram || null, step: 'analyze' }); render(); };
  }
  function stepProduct(o) {
    const prods = o.products || [];
    const sel = o.product || {};
    main.innerHTML = `${stepsBar(3)}<div class="stack"><span class="eyebrow">Primeiro conteúdo</span><h1>Qual produto vamos lançar?</h1><p class="lead">Mande uma foto do celular. Pode ser da galeria ou tirada agora.</p></div>
      <form class="card" id="f">
        <label class="upload-cta" id="up"><input type="file" id="file" accept="image/*" hidden><span id="up-in">${o.file_data ? `<img src="${o.file_data}" alt="">` : '<b>Enviar foto da galeria ou câmera</b><small>JPG, PNG ou foto do iPhone</small>'}</span></label>
        ${prods.length ? `<span class="lbl">Ou escolha da sua loja</span>` : ''}
        <div class="grid" id="grid">${prods.map((p, i) => `<button class="pick" type="button" data-i="${i}" aria-pressed="${sel.image_url === p.image_url ? 'true' : 'false'}"><img src="/api/img?u=${encodeURIComponent(p.image_url)}" alt="${esc(p.name)}" loading="lazy" onerror="this.closest('.pick').remove()">${p.price || (p.name && p.name !== 'Produto' && o.meta?.catalog) ? `<span class="cap">${p.price ? `<b>${esc(p.price)}</b>` : ''}<span>${esc(p.name || '')}</span></span>` : ''}</button>`).join('')}
</div>
        <div class="field"><label for="p-name">Nome do produto</label><input class="input" id="p-name" value="${esc(sel.name || '')}" placeholder="Ex.: Vestido longo Noite"></div>
        <div class="field"><label for="p-price">Preço</label><input class="input" id="p-price" value="${esc(sel.price || '')}" placeholder="R$ 189" inputmode="decimal"></div>
        <div class="field"><label for="p-offer">Condição ou oferta (opcional)</label><input class="input" id="p-offer" value="${esc(o.offer || '')}" placeholder="3x sem juros, frete grátis, só até domingo"></div>
        <p class="hint" id="h"></p>
        <button class="btn btn-primary btn-block" type="submit">Criar meu reels e carrossel grátis</button>
        <button class="btn btn-ghost btn-block" type="button" id="back">Voltar</button></form>`;
    let picked = sel.image_url ? { image_url: sel.image_url, name: sel.name, price: sel.price } : null, file = o.file_data ? { data: o.file_data } : null;
    $$('.pick[data-i]').forEach(b => b.onclick = () => { $$('.pick').forEach(x => x.setAttribute('aria-pressed', 'false')); $('#up').removeAttribute('aria-pressed'); if (file) { file = null; $('#up-in').innerHTML = '<b>Enviar foto da galeria ou câmera</b><small>JPG, PNG ou foto do iPhone</small>'; } b.setAttribute('aria-pressed', 'true'); const p = prods[+b.dataset.i]; picked = { image_url: p.image_url, name: p.name, price: p.price }; file = null; if (!$('#p-name').value) $('#p-name').value = p.name === 'Produto' ? '' : p.name; if (p.price && !$('#p-price').value) $('#p-price').value = p.price; });
    if (file) $('#up').setAttribute('aria-pressed', 'true');
    $('#file').onchange = async e => { const f = e.target.files[0]; if (!f) return; const data = await readPhoto(f); file = { data, type: 'image/jpeg' }; picked = null; $$('.pick').forEach(x => x.setAttribute('aria-pressed', 'false')); $('#up-in').innerHTML = `<img src="${data}" alt=""><small>Toque para trocar</small>`; $('#up').setAttribute('aria-pressed', 'true'); $('#p-name').focus(); };
    $('#f').onsubmit = async e => { e.preventDefault(); const name = $('#p-name').value.trim(); if (!picked && !file) { $('#h').textContent = 'Envie uma foto do produto.'; return; } if (!name) { $('#h').textContent = 'Dê um nome ao produto.'; $('#p-name').focus(); return; }
      // sem logo: as cores da marca saem da foto do produto
      let brand = o.brand;
      if (brand?.colors_pending) { const pal = await photoPalette(file?.data || picked.image_url).catch(() => null); if (pal) brand = { ...brand, colors: pal.colors, colors_pending: false }; }
      ONB.set({ ...o, brand, product: { ...(picked || {}), name, price: $('#p-price').value.trim() }, file_data: file?.data || null, offer: $('#p-offer').value.trim(), step: me.user ? 'generate' : 'auth' }); render(); };
    $('#back').onclick = () => { ONB.set({ ...o, step: 'brand' }); render(); };
  }
  const GICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/></svg>';
  const googleBtn = back => me?.google ? `<a class="btn btn-google btn-block" href="/api/auth/google?back=${back}">${GICON}Continuar com Google</a><p class="or"><span>ou com seu e-mail</span></p>` : '';
  function googleToast(v) {
    const m = { cancelado: 'Login com Google cancelado.', invalido: 'O login expirou. Tente de novo.', erro: 'Não consegui entrar com o Google. Tente de novo ou use o e-mail.', sem_email: 'Essa conta Google não tem e-mail verificado.', off: 'Login com Google ainda não está ativo.' }[v];
    if (m) toast(m, 4500);
    history.replaceState(null, '', location.pathname + location.hash.replace(/[?&]google=[^&]*/, ''));
  }
  function stepAuth(o) {
    if (me.user) { ONB.set({ ...o, step: 'generate' }); return render(); }
    main.innerHTML = `${stepsBar(4)}<div class="stack"><span class="eyebrow">Quase lá</span><h1>Seu e-mail para guardar tudo.</h1><p class="lead">Entre com o Google em um toque, ou receba um código no e-mail. Sem senha, sem cartão.</p></div>
      <form class="card" id="f">${googleBtn('start')}<div class="field"><label for="email">E-mail</label><input class="input" id="email" type="email" inputmode="email" autocomplete="email" placeholder="voce@sualoja.com.br" value="${esc(o.email || '')}"></div><p class="hint" id="h"></p>
      <button class="btn btn-primary btn-block" type="submit"><span class="spin"></span>Receber código</button><button class="btn btn-ghost btn-block" type="button" id="back">Voltar</button></form>`;
    $('#f').onsubmit = async e => { e.preventDefault(); const email = $('#email').value.trim(); const btn = $('#f button[type=submit]'); busy(btn, true);
      try { const d = await api('/auth/request', { method: 'POST', body: { email } }); ONB.set({ ...o, email }); codeForm(email, d.dev_code, async () => { await loadMe(); ONB.set({ ...ONB.get(), step: 'generate' }); render(); }); } catch (err) { $('#h').textContent = err.message; } finally { busy(btn, false); } };
    $('#back').onclick = () => { ONB.set({ ...o, step: 'product' }); render(); };
  }
  function codeForm(email, devCode, onDone) {
    main.innerHTML = `<div class="stack center"><img class="mark" src="/assets/iris-mark.png" alt=""><h1>Digite o código</h1><p class="lead">Enviado para ${esc(email)}. Vale por 10 minutos.</p></div>
      <form class="card" id="f"><input class="input code" id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" value="${esc(devCode || '')}"><p class="hint" id="h"></p>
      ${devCode ? '<p class="micro center">Ambiente de desenvolvimento: o código veio preenchido porque o envio de e-mail não está configurado.</p>' : ''}
      <button class="btn btn-primary btn-block" type="submit"><span class="spin"></span>Entrar</button><button class="btn btn-ghost btn-block" type="button" id="again">Pedir outro código</button></form>`;
    $('#code').focus();
    $('#f').onsubmit = async e => { e.preventDefault(); const btn = $('#f button[type=submit]'); busy(btn, true); try { await api('/auth/verify', { method: 'POST', body: { email, code: $('#code').value.trim() } }); await onDone(); } catch (err) { $('#h').textContent = err.message; busy(btn, false); } };
    $('#again').onclick = async () => { try { const d = await api('/auth/request', { method: 'POST', body: { email } }); toast('Novo código enviado.'); if (d.dev_code) $('#code').value = d.dev_code; } catch (err) { $('#h').textContent = err.message; } };
  }
  async function stepGenerate(o) {
    main.innerHTML = `<img class="mark" src="/assets/iris-mark.png" alt=""><div class="stack center"><h1>Criando seu reels e carrossel</h1><p class="lead" id="msg">Salvando a marca…</p><div class="progress"><i id="bar" style="width:10%"></i></div></div>`;
    const set = (m, w) => { $('#msg').textContent = m; $('#bar').style.width = w + '%'; };
    try {
      await api('/brand', { method: 'PUT', body: o.brand });
      set('Guardando o produto…', 30);
      let body = { name: o.product.name, price: o.product.price, source: 'site', image_url: o.product.image_url };
      if (o.file_data) { const blob = dataUrlToBlob(o.file_data); const up = await fetch('/api/upload', { method: 'POST', headers: { 'content-type': blob.type }, body: blob }).then(r => r.json()); if (!up.ok) throw new Error(up.message || 'Falha no envio da foto.'); body = { ...body, image_url: up.url, image_key: up.key, source: 'upload' }; }
      const { product } = await api('/products', { method: 'POST', body });
      set('Escrevendo legenda, roteiro e slides…', 55);
      const { contents } = await api('/contents', { method: 'POST', body: { product_id: product.id, formats: ['carousel', 'reel'], offer: o.offer || '', gift: true } });
      set('Pronto. Abrindo…', 100);
      await loadMe();
      ONB.set({ step: 'result', ids: contents.map(c => c.id) }); ss.del('iris-loja'); render();
    } catch (e) {
      if (e.code === 'no_credits') { ONB.set({ ...o, step: 'result', ids: [] }); toast(e.message); location.hash = '#/plano'; return; }
      main.innerHTML = `<div class="card"><h2>Não deu certo.</h2><p class="lead">${esc(e.message)}</p><button class="btn btn-primary" id="r">Tentar de novo</button></div>`; $('#r').onclick = render;
    }
  }
  async function stepResult(o) {
    const ids = o.ids || [];
    if (!ids.length) { ONB.set({}); location.hash = '#/home'; return; }
    main.innerHTML = `<div class="stack center"><img class="mark" src="/assets/iris-mark.png" alt=""><span class="eyebrow" style="justify-content:center">Feito para ${esc(me.brand?.name || 'sua loja')}</span><h1>Olha o que a Íris criou.</h1><p class="lead">Seu carrossel e seu reels, com a cara da sua marca. Passe os slides, ajuste o texto se quiser.</p></div><div class="stack" id="out"></div>
      <button class="btn btn-primary btn-block" id="next">Quero baixar e postar</button>`;
    for (const id of ids) { const box = document.createElement('div'); $('#out').appendChild(box); contentBlock(box, id, false, true); }
    $('#next').onclick = () => { ONB.set({ ...o, step: 'offer' }); render(); scrollTo(0, 0); };
  }


  /* ---------- oferta (paywall do onboarding) ---------- */
  /* ---------- pagamento: Pix (AbacatePay, pré-pago) ou cartão (Stripe, renova sozinho) ---------- */
  const PAY = { method: null, period: 'mensal' };
  function payState() {
    const b = me.billing || {}, pixOn = !!b.pix, cardOn = !!b.card;
    if (!PAY.method) PAY.method = pixOn || !cardOn ? 'pix' : 'card';
    const anual = pixOn && Object.values(b.pix).some(x => x.anual);
    if (PAY.method !== 'pix' || !anual) PAY.period = 'mensal';
    return { pixOn, cardOn, anual };
  }
  function payBar() {
    const { pixOn, cardOn, anual } = payState();
    const seg = (k, v, l) => `<button class="chip" type="button" data-${k}="${v}" aria-pressed="${PAY[k] === v}">${l}</button>`;
    return `<div class="stack" style="gap:8px;align-items:center">${pixOn && cardOn || (!pixOn && !cardOn) ? `<div class="chips" style="justify-content:center">${seg('method', 'pix', 'Pix')}${seg('method', 'card', 'Cartão')}</div>` : ''}
      ${PAY.method === 'pix' && anual ? `<div class="chips" style="justify-content:center">${seg('period', 'mensal', 'Mensal')}${seg('period', 'anual', 'Anual <small>2 meses grátis</small>')}</div>` : ''}
      <p class="fine center" style="margin:0">${PAY.method === 'pix' ? (PAY.period === 'anual' ? 'Um Pix por ano. Sem renovação automática.' : 'Um Pix por mês. A Íris avisa antes de vencer, sem cobrança automática.') : 'Cartão renova sozinho todo mês. Cancele quando quiser.'}</p></div>`;
  }
  const priceLabel = p => PAY.method === 'pix' && PAY.period === 'anual' ? `R$ ${p.price * 10}<small>/ano</small>` : `R$ ${p.price}<small>/mês</small>`;
  function bindPay(rerender, back) {
    $$('[data-method]').forEach(b => b.onclick = () => { PAY.method = b.dataset.method; rerender(); });
    $$('[data-period]').forEach(b => b.onclick = () => { PAY.period = b.dataset.period; rerender(); });
    $$('[data-plan]').forEach(b => b.onclick = async () => { busy(b, true); try { const d = await api('/billing/checkout', { method: 'POST', body: { plan: b.dataset.plan, method: PAY.method, period: PAY.period, back } }); if (back === 'start') ONB.set({ ...ONB.get(), step: 'instagram' }); location.href = d.url; } catch (e) { toast(e.message, 5000); busy(b, false); } });
  }

  async function stepOffer(o) {
    const ids = o.ids || [];
    const plans = me.plans;
    main.innerHTML = `<div class="stack center"><img class="mark" src="/assets/iris-mark.png" alt=""><h1>Conteúdo assim toda semana.</h1><p class="lead">Escolha um plano para baixar o que você acabou de ver e continuar criando sem pensar em post.</p></div>
      ${payBar()}
      <div class="plans">${['pro', 'basico', 'loja'].map(k => { const p = plans[k]; return `<div class="plan ${k === 'pro' ? 'on' : ''}">${k === 'pro' ? '<span class="tag wait">Mais escolhido</span>' : ''}<h3>${esc(p.name)}</h3><div class="price">${priceLabel(p)}</div><ul>${p.perks.map(x => `<li>${esc(x)}</li>`).join('')}</ul><button class="btn ${k === 'pro' ? 'btn-primary' : 'btn-ghost'} btn-block" data-plan="${k}"><span class="spin"></span>Assinar ${esc(p.name)}</button></div>`; }).join('')}</div>
      <p class="fine center">Sem fidelidade. Pagamento seguro.</p>
      <p class="micro center"><a href="#" id="free">Continuar no plano grátis</a> <span class="fine">(2 posts por mês, sem reels)</span></p>
      <p class="micro center"><a href="#" id="back">← Voltar para o conteúdo</a></p>`;
    bindPay(() => stepOffer(o), 'start');
    $('#free').onclick = e => { e.preventDefault(); ONB.set({ ...o, step: 'instagram' }); render(); scrollTo(0, 0); };
    $('#back').onclick = e => { e.preventDefault(); ONB.set({ ...o, step: 'result' }); render(); };
  }

  function igToast(v) {
    const m = { ok: 'Instagram conectado.', cancelado: 'Conexão cancelada.', erro: 'Não consegui conectar o Instagram. Tente de novo.', invalido: 'A conexão expirou. Tente de novo.', sessao: 'Entre na sua conta e tente de novo.', off: 'O login do Instagram ainda não foi ativado neste ambiente: falta configurar o app da Meta.' }[v];
    if (m) toast(m, 4000);
    history.replaceState(null, '', location.pathname + location.hash.replace(/[?&]ig=[^&]*/, ''));
  }
  function igCard(back) {
    const ig = me.instagram || {}, acc = ig.account;
    if (acc && !acc.expired) return `<div class="row" style="gap:12px">${acc.picture_url ? `<img src="/api/img?u=${encodeURIComponent(acc.picture_url)}" alt="" style="width:44px;height:44px;border-radius:50%" onerror="this.remove()">` : ''}<p class="lead" style="margin:0">Conectado como <b>@${esc(acc.username || '')}</b>.</p></div>`;
    return `${acc?.expired ? '<p class="hint">A conexão expirou. Conecte de novo.</p>' : ''}<p class="lead">Precisa ser uma conta comercial ou de criador. Você entra pelo próprio Instagram e a Íris só ganha permissão para ver o perfil e publicar.</p><a class="btn btn-primary btn-block" href="/api/instagram/connect?back=${back}">Conectar Instagram</a>`;
  }
  function stepInstagram(o) {
    const done = me.instagram?.account && !me.instagram.account.expired;
    main.innerHTML = `<div class="stack center"><img class="mark" src="/assets/iris-mark.png" alt=""><span class="eyebrow" style="justify-content:center">Último passo</span><h1>${done ? 'Tudo pronto para publicar.' : 'Conecte seu Instagram.'}</h1><p class="lead">${done ? 'Aprove um conteúdo e publique com um toque, sem baixar nada.' : 'Assim a Íris publica o que você aprovar, direto no seu perfil.'}</p></div>
      <div class="card">${igCard('start')}</div>
      <button class="btn ${done ? 'btn-primary' : 'btn-ghost'} btn-block" id="go">${done ? 'Ver meus conteúdos' : 'Agora não'}</button>`;
    $('#go').onclick = () => { ONB.set({}); location.hash = '#/home'; };
  }

  /* ---------- home ---------- */
  /* ---------- painel ---------- */
  const imgSrc = u => !u ? '/assets/iris-mark.png' : u.startsWith(location.origin) || u.startsWith('/') ? u : '/api/img?u=' + encodeURIComponent(u);
  const STAGE = { reel: ['topo', 'Topo', 'atrair'], carousel: ['meio', 'Meio', 'convencer'], feed: ['fundo', 'Fundo', 'vender'] };
  const funnelTag = f => `<span class="tag funnel-${STAGE[f][0]}">${STAGE[f][1]}</span>`;
  function sideInfo() {
    const b = me.brand || {}, ig = me.instagram?.account;
    $('#side-brand').innerHTML = `${b.logo_url ? `<img src="${imgSrc(b.logo_url)}" alt="" onerror="this.remove()">` : ''}<div><b>${esc(b.name || 'Sua loja')}</b><small>${ig ? '@' + esc(ig.username) + ' conectado' : b.instagram ? '@' + esc(b.instagram) : 'Instagram não conectado'}</small></div>`;
    const n = (v, a, b) => `${v} ${v === 1 ? a : b}`, l = me.usage.left;
    $('#side-foot').innerHTML = `<a class="side-plan" href="#/plano"><b>Plano ${esc(me.user.plan_name)}</b><span>${n(l.posts, 'post', 'posts')}${me.usage.limit.reels ? ' e ' + n(l.reels, 'reels', 'reels') : ''} ${l.posts + (me.usage.limit.reels ? l.reels : 0) === 1 ? 'restante' : 'restantes'} no mês</span><span class="up">${me.user.plan === 'free' ? 'Ver planos' : 'Gerenciar plano'} →</span></a>`;
  }
  // datas do varejo brasileiro que puxam venda de moda e beleza
  function retailDates(from = new Date()) {
    const nth = (y, m, wd, n) => { const d = new Date(y, m, 1); d.setDate(1 + ((wd - d.getDay() + 7) % 7) + (n - 1) * 7); return d; };
    const lastWd = (y, m, wd) => { const d = new Date(y, m + 1, 0); d.setDate(d.getDate() - ((d.getDay() - wd + 7) % 7)); return d; };
    const out = [];
    for (const y of [from.getFullYear(), from.getFullYear() + 1]) {
      const bf = lastWd(y, 10, 5);
      out.push(
        { d: new Date(y, 2, 15), n: 'Dia do Consumidor', t: 'Oferta relâmpago no feed e carrossel de mais vendidos.' },
        { d: nth(y, 4, 0, 2), n: 'Dia das Mães', t: 'Carrossel de presentes por faixa de preço, 3 semanas antes.' },
        { d: new Date(y, 5, 12), n: 'Dia dos Namorados', t: 'Reels de presente embrulhado e feed com preço e entrega.' },
        { d: nth(y, 7, 0, 2), n: 'Dia dos Pais', t: 'Carrossel "presente pronto" com kits e preço.' },
        { d: new Date(y, 8, 15), n: 'Dia do Cliente', t: 'Feed com cupom e carrossel de agradecimento.' },
        { d: new Date(y, 9, 12), n: 'Dia das Crianças', t: 'Kits e combos em carrossel.' },
        { d: bf, n: 'Black Friday', t: 'Aqueça com reels 2 semanas antes. Na semana, feed com preço e condição todo dia.' },
        { d: new Date(bf.getFullYear(), 10, bf.getDate() + 3), n: 'Cyber Monday', t: 'Última chamada: feed com o que sobrou e frete.' },
        { d: new Date(y, 10, 30), n: '1ª parcela do 13º', t: 'Dinheiro no bolso: feed de desejo com parcelamento.' },
        { d: new Date(y, 11, 20), n: '2ª parcela do 13º', t: 'Presentes de última hora com entrega garantida.' },
        { d: new Date(y, 11, 25), n: 'Natal', t: 'Carrossel de presentes por preço desde o começo de dezembro.' },
      );
    }
    const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    return out.map(x => ({ ...x, days: Math.round((x.d - today) / 86400e3) })).filter(x => x.days >= 0 && x.days <= 75).sort((a, b) => a.days - b.days);
  }
  const monday = (d = new Date()) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  async function viewHome() {
    const { contents } = await api('/contents');
    const b = me.brand || {}, u = me.usage, plan = me.plans[me.user.plan] || me.plans.free;
    const wk = monday(), thisWeek = contents.filter(c => new Date(c.created_at) >= wk && c.status !== 'failed');
    const ready = contents.filter(c => ['completed', 'approved'].includes(c.status));
    const generating = contents.filter(c => ['queued', 'in_progress'].includes(c.status));
    const month = new Date().toISOString().slice(0, 7);
    const published = contents.filter(c => c.status === 'published' && String(c.published_at || c.updated_at).startsWith(month));
    // meta da semana por etapa: reels = topo; posts divididos entre carrossel (meio) e feed (fundo)
    const wkPosts = plan.weekly.posts || 2, wkReels = plan.weekly.reels || 1;
    const goal = { reel: wkReels, carousel: Math.ceil(wkPosts / 2), feed: Math.floor(wkPosts / 2) || 1 };
    const done = f => thisWeek.filter(c => c.format === f).length;
    const credit = f => f === 'reel' ? u.left.reels > 0 : u.left.posts > 0;
    const next = ['feed', 'carousel', 'reel'].filter(credit).sort((x, y) => done(x) / goal[x] - done(y) / goal[y])[0];
    const dates = retailDates(), soon = dates.find(d => d.days <= 21);
    const used = new Set(thisWeek.map(c => c.product_id));
    const prod = (me.products || []).find(p => !used.has(p.id)) || (me.products || [])[0];
    const why = { reel: 'para quem ainda não conhece a loja descobrir', carousel: 'mostrando detalhes, uso e combinações para convencer', feed: 'com preço e condição para fechar a venda' };
    const nextHref = next && prod ? `#/create?format=${next}&product=${prod.id}${soon && next !== 'reel' ? '&offer=' + encodeURIComponent(soon.n) : ''}` : '#/create';
    const weeks = [...Array(8)].map((_, i) => { const s0 = new Date(wk); s0.setDate(s0.getDate() - (7 - i) * 7); const e0 = new Date(s0); e0.setDate(e0.getDate() + 7); return { n: contents.filter(c => { const t = new Date(c.created_at); return t >= s0 && t < e0; }).length, now: i === 7, label: `${s0.getDate()}/${s0.getMonth() + 1}` }; });
    const maxW = Math.max(1, ...weeks.map(w => w.n));
    main.innerHTML = `
      <div class="dash-head"><div class="who">${b.logo_url ? `<img src="${imgSrc(b.logo_url)}" alt="" onerror="this.remove()">` : ''}<div><span class="eyebrow">Visão geral</span><h1>${esc(b.name || 'Sua loja')}</h1></div></div>
        <a class="btn btn-primary" href="${nextHref}">Criar o próximo post</a></div>
      ${me.billing?.renew_soon ? `<div class="card tight row between"><p style="margin:0">Seu plano pago com Pix vence em ${Math.max(0, Math.ceil((new Date(me.billing.until) - Date.now()) / 86400e3))} dia(s).</p><a class="btn btn-primary btn-sm" href="#/plano">Renovar com Pix</a></div>` : ''}
      ${chatCard(next, prod, soon)}
      <div class="kpis">
        <div class="kpi"><div class="ic ok"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17l9-10"/></svg></div><span>Prontos para postar</span><b>${ready.length}</b><small>${generating.length ? generating.length + ' gerando agora' : 'aprovados e para revisar'}</small></div>
        <div class="kpi"><div class="ic pub"><svg viewBox="0 0 24 24"><path d="M4 12h12M12 6l6 6-6 6"/></svg></div><span>Publicados no mês</span><b>${published.length}</b><small>${me.instagram?.account ? 'direto no Instagram' : 'conecte o Instagram para publicar'}</small></div>
        <div class="kpi"><div class="ic img"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m4 16 5-5 4 4 3-3 4 4"/></svg></div><span>Posts restantes</span><b>${u.left.posts}</b><small>de ${u.limit.posts} no mês</small></div>
        <div class="kpi"><div class="ic vid"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg></div><span>Reels restantes</span><b>${u.limit.reels ? u.left.reels : '–'}</b><small>${u.limit.reels ? 'de ' + u.limit.reels + ' no mês' : 'não incluso no plano grátis'}</small></div>
      </div>
      <div class="dash-grid">
        <div class="stack">
          <div class="card"><div class="row between"><h3>Funil da semana<small>Postagens desde segunda, por etapa. Reels atraem, carrossel convence, feed vende.</small></h3><button class="btn btn-ghost btn-sm" type="button" id="ins-r" hidden>Atualizar</button></div>
            <div class="fn" id="fn">${['reel', 'carousel', 'feed'].map(f => fnRow(f, { posts: done(f) }, goal[f], null)).join('')}</div>
            <div id="fn-foot" class="fn-foot"></div>
            ${next && prod ? `<div class="suggest"><span class="eyebrow">Próximo post sugerido</span><p><b>${FORMAT[next]} de ${esc(prod.name)}</b> ${why[next]}${soon && next !== 'reel' ? `, já puxando o gancho de ${esc(soon.n)}` : ''}.</p><a class="btn btn-primary btn-sm" href="${nextHref}">Criar agora</a></div>`
              : !prod ? `<div class="suggest"><p>Envie a foto de um produto para a Íris sugerir os próximos posts.</p><a class="btn btn-primary btn-sm" href="#/create">Enviar foto</a></div>`
              : `<div class="suggest"><p>Você usou os créditos do mês. Mude de plano para manter o ritmo.</p><a class="btn btn-primary btn-sm" href="#/plano">Ver planos</a></div>`}
          </div>
          <div class="card"><div class="row between"><h3>Prontos para postar<small>Revise, aprove e publique.</small></h3><a class="micro" href="#/conteudos">Ver todos</a></div>
            ${ready.length ? `<div class="posts">${ready.slice(0, 8).map(postCard).join('')}</div>` : `<p class="lead">${generating.length ? 'Seu conteúdo está sendo gerado. Volte em alguns minutos.' : 'Nada pronto ainda. Crie o próximo post sugerido acima.'}</p>`}
          </div>
          <div class="card"><h3>Ritmo<small>Conteúdos criados por semana.</small></h3>
            <div class="weeks">${weeks.map(w => `<div class="${w.now ? 'now' : ''}"><i style="height:${Math.max(4, Math.round(w.n / maxW * 52))}px" title="${w.n} conteúdos"></i><span>${w.label}</span></div>`).join('')}</div></div>
        </div>
        <div class="stack">
          <div class="card"><h3>Datas que vendem<small>O que vem aí no varejo.</small></h3>
            ${dates.length ? `<div class="dates">${dates.slice(0, 4).map(d => `<div class="d"><div class="when">${d.days === 0 ? 'hoje' : d.days}<small>${d.days === 0 ? '' : d.days === 1 ? 'dia' : 'dias'}</small></div><div><b>${esc(d.n)}</b> · ${d.d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}<p>${esc(d.t)}</p></div></div>`).join('')}</div>` : '<p class="lead">Nenhuma data forte nas próximas semanas. Bom momento para novidades.</p>'}</div>
          <div class="card"><div class="row between"><h3>Sua loja</h3><a class="micro" href="#/conta">Editar</a></div>
            <dl class="ctx">
              <div><dt>Cores</dt><dd class="sw">${['primary', 'secondary', 'accent'].map(k => `<i style="background:${esc(b.colors?.[k] || '#ccc')}"></i>`).join('')}</dd></div>
              ${b.icp ? `<div><dt>Quem compra</dt><dd>${esc(b.icp)}</dd></div>` : ''}
              ${b.tone ? `<div><dt>Tom de voz</dt><dd>${esc(b.tone)}</dd></div>` : ''}
              <div><dt>Produtos</dt><dd>${(me.products || []).length} cadastrados${b.site_url ? ` · <a href="${esc(b.site_url)}" target="_blank" rel="noopener">site</a>` : ''}</dd></div>
              <div><dt>Instagram</dt><dd>${me.instagram?.account ? '@' + esc(me.instagram.account.username) + ' conectado' : `<a href="#/conta">Conectar para publicar</a>`}</dd></div>
            </dl></div>
        </div>
      </div>`;
    hydrateArts(ready.slice(0, 8));
    bindChat(next);
    loadInsights(goal, done);
  }
  const postCard = c => `<a class="post" href="#/content/${c.id}" data-c="${c.id}"><div class="art"><img src="${thumb(c)}" alt="" loading="lazy"></div><div><b>${esc(c.spec.product?.name || FORMAT[c.format])}</b>${funnelTag(c.format)}</div></a>`;
  async function hydrateArts(contents) {
    const byId = Object.fromEntries(contents.map(c => [c.id, c]));
    for (const el of $$('.post[data-c] .art')) {
      const c = byId[el.parentElement.dataset.c]; if (!c || c.status === 'failed') continue;
      try { el.innerHTML = await svgFor(c, c.format === 'reel' ? 'reel' : c.format === 'carousel' ? 'carousel' : 'feed', 0); } catch { }
    }
  }
  /* ---------- métricas da semana no funil ---------- */
  const nf = n => n == null ? '–' : n >= 10000 ? (n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil' : Number(n).toLocaleString('pt-BR');
  // a métrica que importa em cada etapa: topo = quanta gente nova viu; meio = quem guardou e mandou; fundo = quem foi ao perfil para comprar
  const FN_METRICS = { reel: [['reach', 'alcance'], ['views', 'visualizações']], carousel: [['saved', 'salvamentos'], ['shares', 'compartilhamentos']], feed: [['interactions', 'interações'], ['profile_visits', 'visitas ao perfil']] };
  function fnRow(f, st, goal, metrics) {
    const posts = st?.posts || 0, pct = Math.min(100, Math.round(posts / goal * 100));
    return `<div class="fn-row"><div class="fn-name"><b>${FORMAT[f]}</b><small>${STAGE[f][1]} · ${STAGE[f][2]}</small></div>
      <div class="fn-posts"><div class="bar"><i style="width:${pct}%"></i></div><small>${posts} de ${goal} na semana</small></div>
      ${FN_METRICS[f].map(([k, l]) => `<div class="fn-m"><b>${metrics ? nf(metrics[k]) : '–'}</b><small>${l}</small></div>`).join('')}</div>`;
  }
  async function loadInsights(goal, done) {
    const foot = $('#fn-foot'); if (!foot) return;
    const ig = me.instagram || {};
    if (!ig.account || ig.account.expired) {
      foot.innerHTML = `<p class="micro">${ig.enabled ? `<a href="/api/instagram/connect">Conecte o Instagram</a> para ver alcance, salvamentos e visitas ao perfil de cada etapa.` : 'Quando o Instagram estiver conectado, aqui aparecem alcance, salvamentos e visitas ao perfil de cada etapa.'} Por enquanto, as barras mostram o que a Íris criou na semana.</p>`;
      return;
    }
    foot.innerHTML = '<p class="micro">Lendo as métricas do Instagram…</p>';
    const draw = d => {
      if (!d.connected || d.error) { foot.innerHTML = `<p class="hint">${esc(d.error || 'Não consegui ler as métricas agora.')}</p>`; return; }
      $('#fn').innerHTML = ['reel', 'carousel', 'feed'].map(f => fnRow(f, d.stages[f], goal[f], d.stages[f])).join('');
      const t = d.total, top = d.top, ago = Math.max(1, Math.round((Date.now() - new Date(d.updated_at)) / 60000));
      foot.innerHTML = `<div class="fn-total"><span><b>${nf(t.reach)}</b> de alcance</span><span><b>${t.engagement == null ? '–' : t.engagement.toLocaleString('pt-BR') + '%'}</b> de engajamento</span><span><b>${nf(t.profile_visits)}</b> visitas ao perfil</span></div>
        ${top ? `<a class="fn-top" href="${esc(top.permalink)}" target="_blank" rel="noopener">${top.image ? `<img src="${imgSrc(top.image)}" alt="">` : ''}<div><small>Melhor post da semana · ${FORMAT[top.stage]}</small><b>${nf(top.interactions)} interações · ${nf(top.reach)} de alcance</b>${top.caption ? `<span>${esc(top.caption)}</span>` : ''}</div></a>` : t.posts ? '' : '<p class="micro">Nenhum post publicado no Instagram desde segunda.</p>'}
        <p class="fine">Atualizado há ${ago < 60 ? ago + ' min' : Math.round(ago / 60) + ' h'}${d.stale ? ', última leitura salva' : ''}. O Instagram pode levar até 48 h para fechar os números.</p>`;
      $('#ins-r').hidden = false;
    };
    try { draw(await api('/insights/week')); } catch (e) { foot.innerHTML = `<p class="hint">${esc(e.message)}</p>`; }
    $('#ins-r').onclick = async () => { busy($('#ins-r'), true); try { draw(await api('/insights/week?refresh=1')); } catch (e) { toast(e.message); } busy($('#ins-r'), false); };
  }
  /* ---------- "Íris, cria…" ---------- */
  const CHAT = { att: null, log: (() => { try { return JSON.parse(ss.get('iris-chat') || '[]'); } catch { return []; } })() };
  const saveChat = () => ss.set('iris-chat', JSON.stringify(CHAT.log.slice(-6)));
  function chatCard(next, prod, soon) {
    const ideas = [
      prod && next ? `${{ reel: 'um reels', carousel: 'um carrossel', feed: 'um post' }[next]} de ${prod.name}` : null,
      soon ? `um post de ${soon.n} com a novidade da semana` : null,
      prod ? `uma campanha completa de ${prod.name}` : 'um carrossel da novidade que chegou',
    ].filter(Boolean);
    const ig = me.instagram || {};
    return `<div class="card chat">
      <div class="chat-log" id="chat-log">${CHAT.log.map(chatMsg).join('')}</div>
      <form id="chat-f" class="stack" style="gap:10px">
        <div class="chat-box"><label for="chat-t" class="pfx">Íris, cria</label><textarea id="chat-t" rows="2" placeholder="um carrossel do vestido novo para a Black Friday, 3x sem juros"></textarea></div>
        <div id="chat-att" class="chat-att" hidden></div>
        <div id="chat-ig" class="chat-ig" hidden></div>
        <div class="row between">
          <div class="row">
            <label class="btn btn-ghost btn-sm"><input type="file" id="chat-file" accept="image/*" hidden><svg viewBox="0 0 24 24" class="i"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>Foto do celular</label>
            <button class="btn btn-ghost btn-sm" type="button" id="chat-igb"><svg viewBox="0 0 24 24" class="i"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>${ig.account && !ig.account.expired ? 'Do meu Instagram' : 'Conectar Instagram'}</button>
          </div>
          <button class="btn btn-primary btn-sm" type="submit" id="chat-go"><span class="spin"></span>Criar</button>
        </div>
        <div class="chips">${ideas.map(t => `<button class="chip" type="button" data-idea="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      </form></div>`;
  }
  const chatMsg = m => m.me ? `<p class="msg me">Íris, cria ${esc(m.text)}</p>` : `<div class="msg iris"><p>${esc(m.text)}</p>${m.ids?.length ? `<div class="posts">${m.ids.map(i => `<a class="post" href="#/content/${i.id}" data-c="${i.id}"><div class="art"></div><div><b>${esc(FORMAT[i.format])}</b>${funnelTag(i.format)}</div></a>`).join('')}</div>` : ''}</div>`;
  function setAtt(att) {
    CHAT.att = att; const box = $('#chat-att');
    box.hidden = !att; if (!att) { box.innerHTML = ''; return; }
    box.innerHTML = `<img src="${att.thumb}" alt=""><span>${att.ig ? 'Post do Instagram' : 'Foto do celular'}</span><button type="button" class="btn btn-ghost btn-sm" id="chat-x" aria-label="Remover foto">Remover</button>`;
    $('#chat-x').onclick = () => setAtt(null);
  }
  async function bindChat(next) {
    const log = $('#chat-log'); if (!log) return;
    const contentsById = async () => (await api('/contents')).contents;
    if (CHAT.log.some(m => m.ids?.length)) hydrateArts(await contentsById());
    $$('[data-idea]').forEach(b => b.onclick = () => { $('#chat-t').value = b.dataset.idea; $('#chat-t').focus(); });
    $('#chat-file').onchange = async e => { const f = e.target.files[0]; if (!f) return; const data = await readPhoto(f); const blob = dataUrlToBlob(data);
      const up = await fetch('/api/upload', { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: blob }).then(r => r.json()).catch(() => ({}));
      if (!up.ok) { toast(up.message || 'Não consegui enviar a foto.', 5000); return; }
      setAtt({ upload: { key: up.key, url: up.url }, thumb: data }); e.target.value = ''; };
    $('#chat-igb').onclick = async () => {
      const ig = me.instagram || {};
      if (!ig.account || ig.account.expired) { if (ig.enabled) location.href = '/api/instagram/connect'; else toast('A conexão com o Instagram ainda não está ativa. Use a foto do celular.', 5000); return; }
      const box = $('#chat-ig'); if (!box.hidden) { box.hidden = true; return; }
      box.hidden = false; box.innerHTML = '<p class="micro">Carregando seus posts…</p>';
      try { const { media } = await api('/instagram/media');
        box.innerHTML = media.length ? `<div class="grid">${media.map(m => `<button class="pick" type="button" data-ig="${esc(m.id)}" data-src="${esc(m.image)}"><img src="${imgSrc(m.image)}" alt="" loading="lazy"></button>`).join('')}</div>` : '<p class="micro">Nenhum post com foto encontrado.</p>';
        $$('[data-ig]', box).forEach(b => b.onclick = () => { setAtt({ ig_media_id: b.dataset.ig, thumb: imgSrc(b.dataset.src), ig: true }); box.hidden = true; });
      } catch (e) { box.innerHTML = `<p class="hint">${esc(e.message)}</p>`; } };
    $('#chat-f').onsubmit = async e => { e.preventDefault();
      const text = $('#chat-t').value.trim(); if (text.length < 3 && !CHAT.att) { $('#chat-t').focus(); return; }
      const btn = $('#chat-go'); busy(btn, true);
      CHAT.log.push({ me: true, text: text || 'um post com esta foto' }); log.insertAdjacentHTML('beforeend', chatMsg(CHAT.log.at(-1)));
      try {
        const r = await api('/chat', { method: 'POST', body: { text, default_format: next, ...(CHAT.att?.upload ? { upload: CHAT.att.upload } : {}), ...(CHAT.att?.ig_media_id ? { ig_media_id: CHAT.att.ig_media_id } : {}) } });
        CHAT.log.push({ text: r.reply, ids: r.contents.map(c => ({ id: c.id, format: c.format })) });
        log.insertAdjacentHTML('beforeend', chatMsg(CHAT.log.at(-1))); hydrateArts(r.contents);
        $('#chat-t').value = ''; setAtt(null); await loadMe(); sideInfo();
      } catch (err) { CHAT.log.push({ text: err.message }); log.insertAdjacentHTML('beforeend', chatMsg(CHAT.log.at(-1))); }
      finally { saveChat(); busy(btn, false); log.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } };
  }
  /* ---------- conteúdos: fluxo de postagens ---------- */
  async function viewContents(r) {
    const { contents } = await api('/contents');
    const f = r.q.get('f') || 'all';
    const list = contents.filter(c => f === 'all' || c.format === f);
    const cols = [['Gerando', c => ['queued', 'in_progress'].includes(c.status)], ['Para revisar', c => c.status === 'completed'], ['Aprovados', c => c.status === 'approved'], ['Publicados', c => c.status === 'published'], ['Com erro', c => c.status === 'failed']];
    main.innerHTML = `<div class="dash-head"><div><span class="eyebrow">Fluxo de postagens</span><h1>Conteúdos</h1></div><a class="btn btn-primary" href="#/create">Criar</a></div>
      <nav class="subnav">${[['all', 'Todos'], ['reel', 'Reels · topo'], ['carousel', 'Carrossel · meio'], ['feed', 'Feed · fundo']].map(([k, l]) => `<a href="#/conteudos?f=${k}" aria-current="${f === k ? 'page' : 'false'}">${l}</a>`).join('')}</nav>
      <div class="board">${cols.filter(([n, fn]) => n !== 'Com erro' || list.some(fn)).map(([n, fn]) => { const items = list.filter(fn); return `<section class="col"><h3>${n}<span>${items.length}</span></h3>${items.length ? items.map(postCard).join('') : '<p class="empty">Nada aqui.</p>'}</section>`; }).join('')}</div>`;
    hydrateArts(list);
  }
  const thumb = c => c.spec.product?.image_url ? (c.spec.product.image_url.startsWith(location.origin) ? c.spec.product.image_url : '/api/img?u=' + encodeURIComponent(c.spec.product.image_url)) : '/assets/iris-mark.png';
  const statusTag = c => ({ queued: '<span class="tag wait">gerando</span>', in_progress: '<span class="tag wait">gerando</span>', completed: '<span class="tag">pronto</span>', approved: '<span class="tag ok">aprovado</span>', published: '<span class="tag ok">publicado</span>', failed: '<span class="tag err">falhou</span>' }[c.status] || '');

  /* ---------- criar ---------- */
  async function viewCreate(r) {
    const prods = me.products || [];
    const pre = r.q.get('product'), preF = r.q.get('format');
    main.innerHTML = `<div class="stack"><span class="eyebrow">Criar</span><h1>O que vamos postar?</h1></div>
      <form class="card" id="f">
        <div class="field"><span class="lbl">Produto</span><div class="grid" id="grid"><label class="pick add"><input type="file" id="file" accept="image/*" hidden>+ Foto do celular</label>${prods.map(p => `<button class="pick" type="button" data-id="${p.id}" aria-pressed="${p.id === pre ? 'true' : 'false'}"><img src="${p.image_url.startsWith(location.origin) ? p.image_url : '/api/img?u=' + encodeURIComponent(p.image_url)}" alt="${esc(p.name)}" loading="lazy"></button>`).join('')}</div></div>
        <div id="newp" hidden class="stack"><div class="field"><label for="p-name">Nome do produto</label><input class="input" id="p-name"></div><div class="field"><label for="p-price">Preço</label><input class="input" id="p-price" placeholder="R$ 189"></div></div>
        <div class="field"><span class="lbl">Formatos</span><div class="chips">
          <button class="chip" type="button" data-f="reel" aria-pressed="${preF === 'reel'}">Reels <small>topo · ser descoberto</small></button>
          <button class="chip" type="button" data-f="carousel" aria-pressed="${preF === 'carousel'}">Carrossel <small>meio · convencer</small></button>
          <button class="chip" type="button" data-f="feed" aria-pressed="${!preF || preF === 'feed'}">Post no feed <small>fundo · vender</small></button></div>
          <p class="micro">Reels mostra o produto sem texto na tela. Carrossel explica. Feed fecha a venda com preço e oferta.</p>
          <p class="micro">Você tem ${me.usage.left.posts} posts e ${me.usage.left.reels} reels neste mês.</p></div>
        <div class="field"><label for="offer">Condição ou oferta (opcional, não entra no reels)</label><input class="input" id="offer" placeholder="3x sem juros, frete grátis, só até domingo" value="${esc(r.q.get('offer') || '')}"></div>
        <p class="hint" id="h"></p>
        <button class="btn btn-primary btn-block" type="submit"><span class="spin"></span>Gerar</button></form>`;
    let pid = pre || null, file = null;
    $$('.pick[data-id]').forEach(b => b.onclick = () => { $$('.pick').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); pid = b.dataset.id; file = null; $('#newp').hidden = true; });
    $('#file').onchange = async e => { const f = e.target.files[0]; if (!f) return; file = dataUrlToBlob(await readPhoto(f)); pid = null; $$('.pick').forEach(x => x.setAttribute('aria-pressed', 'false')); const lab = $('.pick.add'); lab.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="">`; lab.setAttribute('aria-pressed', 'true'); $('#newp').hidden = false; $('#p-name').focus(); };
    $$('.chip[data-f]').forEach(c => c.onclick = () => c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'));
    $('#f').onsubmit = async e => { e.preventDefault(); const formats = $$('.chip[aria-pressed="true"]').map(c => c.dataset.f); const btn = $('#f button[type=submit]');
      if (!formats.length) { $('#h').textContent = 'Escolha pelo menos um formato.'; return; }
      if (!pid && !file) { $('#h').textContent = 'Escolha um produto ou envie uma foto.'; return; }
      busy(btn, true);
      try {
        if (file) { const name = $('#p-name').value.trim(); if (!name) throw new Error('Dê um nome ao produto.'); const up = await fetch('/api/upload', { method: 'POST', headers: { 'content-type': file.type }, body: file }).then(r => r.json()); if (!up.ok) throw new Error(up.message || 'Falha no envio.'); const { product } = await api('/products', { method: 'POST', body: { name, price: $('#p-price').value.trim(), image_url: up.url, image_key: up.key, source: 'upload' } }); pid = product.id; }
        const { contents } = await api('/contents', { method: 'POST', body: { product_id: pid, formats, offer: $('#offer').value.trim() } });
        await loadMe(); location.hash = '#/content/' + contents[0].id; if (contents.length > 1) toast(`${contents.length} conteúdos criados.`);
      } catch (err) { $('#h').textContent = err.message; if (err.code === 'no_credits') setTimeout(() => location.hash = '#/plano', 1200); } finally { busy(btn, false); } };
  }

  /* ---------- conteúdo ---------- */
  async function viewContent(r) {
    main.innerHTML = `<a class="micro" href="#/conteudos">← Conteúdos</a><div id="box"></div>`;
    contentBlock($('#box'), r.id, true);
  }
  async function contentBlock(box, id, full, showcase = false) {
    let { content: c } = await api('/contents/' + id);
    const draw = async () => {
      const copy = c.spec.copy || {};
      box.innerHTML = `<div class="card"><div class="row between"><h2>${esc(FORMAT[c.format])}</h2>${statusTag(c)}</div><p class="micro">${esc(c.spec.product?.name || '')}${c.spec.product?.price ? ' · ' + esc(c.spec.product.price) : ''}</p>
        <div class="preview" id="pv"><p class="micro">Montando a arte…</p></div>
        <div class="stack" id="edit"></div>
        <div class="row" id="actions"></div></div>`;
      const pv = $('#pv', box), ed = $('#edit', box), ac = $('#actions', box);
      try {
        if (c.format === 'reel') await drawReel(pv, c); else await drawSlides(pv, c);
      } catch (e) { console.error(e); pv.innerHTML = `<p class="hint">Não consegui montar a arte: ${esc(e.message)}</p>`; }
      // edição
      const fields = c.format === 'feed' ? [['hook', 'Hook (título da arte)'], ['body', 'Body (subtítulo da arte)'], ['caption', 'Legenda']] : c.format === 'reel' ? [['hook', 'Gancho (1ª linha da legenda, fora do vídeo)'], ['caption', 'Legenda']] : [['caption', 'Legenda']];
      ed.innerHTML = `<details><summary class="btn btn-ghost btn-sm">Editar texto</summary><div class="stack" style="padding-top:12px">${fields.map(([k, l]) => `<div class="field"><label for="e-${k}">${l}</label><textarea class="input" id="e-${k}">${esc(copy[k] || (k === 'hook' ? copy.headline || copy.title : '') || '')}</textarea></div>`).join('')}
        ${c.format === 'carousel' ? (copy.slides || []).map((s, i) => `<div class="field"><label>Slide ${i + 1}: hook e body</label><input class="input" id="s-t-${i}" value="${esc(s.title)}"><input class="input" id="s-b-${i}" value="${esc(s.body)}"></div>`).join('') : ''}
        <button class="btn btn-primary btn-sm" id="save">Salvar e montar de novo</button></div></details>`;
      $('#save', box).onclick = async () => { const nc = {}; fields.forEach(([k]) => nc[k] = $('#e-' + k, box).value); if (c.format === 'carousel') nc.slides = (copy.slides || []).map((s, i) => ({ title: $('#s-t-' + i, box).value, body: $('#s-b-' + i, box).value }));
        c = (await api('/contents/' + c.id, { method: 'PATCH', body: { copy: nc } })).content; draw(); toast('Texto salvo.'); };
      // ações
      const approved = c.status === 'approved', published = c.status === 'published', ready = c.status === 'completed' || approved || published;
      if (showcase) { ac.innerHTML = ''; if (c.format === 'reel' && ['queued', 'in_progress'].includes(c.status)) setTimeout(async () => { try { c = (await api('/contents/' + c.id)).content; } catch { } if (document.body.contains(box)) draw(); }, 6000); return; }
      const ig = me.instagram || {}, igOn = ig.account && !ig.account.expired, canPub = ready && !published && (c.format !== 'reel' || c.output_url || c.output_key);
      ac.innerHTML = `${published ? `${c.ig_permalink ? `<a class="btn btn-primary" href="${esc(c.ig_permalink)}" target="_blank" rel="noopener">Ver no Instagram</a>` : '<span class="micro">Publicado no Instagram.</span>'}` : ''}
        ${canPub && igOn ? `<button class="btn btn-primary" id="pub"><span class="spin"></span>Publicar no Instagram</button>` : ''}
        ${canPub && !igOn && ig.enabled ? `<a class="btn btn-ghost" href="/api/instagram/connect">Conectar Instagram para publicar</a>` : ''}
        ${ready && !published ? `<button class="btn ${approved || igOn ? 'btn-ghost' : 'btn-primary'}" id="ap">${approved ? 'Desaprovar' : 'Aprovar'}</button>` : ''}
        ${ready ? `<button class="btn btn-ghost" id="dl">Baixar ${c.format === 'reel' ? 'capa' : c.format === 'carousel' ? 'slides' : 'imagem'}</button>` : ''}
        ${c.format === 'reel' && c.output_url ? `<a class="btn btn-ghost" href="${c.output_key ? '/media/' + c.output_key + '?download' : c.output_url}" download>Baixar vídeo</a>` : ''}
        ${ready ? `<button class="btn btn-ghost" id="cp">Copiar legenda</button>` : ''}
        ${full ? `<button class="btn btn-ghost btn-sm" id="del">Excluir</button>` : ''}`;
      if ($('#ap', box)) $('#ap', box).onclick = async () => { c = (await api('/contents/' + c.id, { method: 'PATCH', body: { action: approved ? 'unapprove' : 'approve' } })).content; draw(); toast(approved ? 'Voltou para rascunho.' : 'Aprovado. Pode postar.'); };
      if ($('#dl', box)) $('#dl', box).onclick = () => downloadAll(box, c);
      if ($('#pub', box)) $('#pub', box).onclick = async () => { const btn = $('#pub', box); busy(btn, true); try { await publishToIg(box, c); c = (await api('/contents/' + c.id)).content; draw(); } catch (e) { toast(e.message, 6000); busy(btn, false); } };
      if ($('#cp', box)) $('#cp', box).onclick = async () => { const t = (copy.caption || '') + (copy.hashtags ? '\n\n' + copy.hashtags.join(' ') : ''); try { await navigator.clipboard.writeText(t); toast('Legenda copiada.'); } catch { prompt('Copie a legenda:', t); } };
      if ($('#del', box)) $('#del', box).onclick = async () => { if (!$('#del', box).dataset.sure) { $('#del', box).dataset.sure = '1'; $('#del', box).textContent = 'Confirmar exclusão'; return; } await api('/contents/' + c.id, { method: 'DELETE' }); location.hash = '#/home'; };
      if (c.format === 'reel' && ['queued', 'in_progress'].includes(c.status)) setTimeout(async () => { try { c = (await api('/contents/' + c.id)).content; } catch { } if (!document.body.contains(box)) return; draw(); }, 6000);
    };
    draw();
  }

  /* ---------- renderização das artes (SVG → PNG) ---------- */
  const fontCache = {};
  async function fontFace(family) {
    if (fontCache[family]) return fontCache[family];
    const p = (async () => {
      try {
        const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@700&display=swap`, { headers: { 'user-agent': navigator.userAgent } }).then(r => r.text());
        const url = /url\(([^)]+\.(?:woff2|ttf|woff))\)/.exec(css)?.[1]; if (!url) return '';
        const buf = await fetch(url).then(r => r.arrayBuffer());
        const b64 = btoa(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''));
        const fmt = url.endsWith('.woff2') ? 'woff2' : url.endsWith('.ttf') ? 'truetype' : 'woff';
        return `@font-face{font-family:'${family}';font-weight:700;src:url(data:font/${fmt};base64,${b64}) format('${fmt}')}`;
      } catch { return ''; }
    })();
    fontCache[family] = p; return p;
  }
  async function imgData(url) {
    const src = url.startsWith(location.origin) || url.startsWith('/') ? url : '/api/img?u=' + encodeURIComponent(url);
    const blob = await fetch(src).then(r => { if (!r.ok) throw new Error('foto indisponível'); return r.blob(); });
    return new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
  }
  const wrap = (t, max) => { const w = String(t || '').split(' '), lines = []; let cur = ''; w.forEach(x => { if ((cur + ' ' + x).trim().length > max) { lines.push(cur.trim()); cur = x; } else cur += ' ' + x; }); if (cur.trim()) lines.push(cur.trim()); return lines; };
  const textLines = (lines, x, y, size, fill, anchor = 'start', weight = 700) => lines.map((l, i) => `<text x="${x}" y="${y + i * size * 1.12}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(l)}</text>`).join('');
  function readable(bg) { const n = parseInt(bg.slice(1), 16); const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)); return l > 150 ? '#1F140D' : '#FFFFFF'; }
  async function svgFor(c, kind, i) {
    const b = c.spec.brand || {}, col = b.colors || {}, P = col.primary || '#1F140D', S = col.secondary || '#FFF9EF', A = col.accent || '#FFD83A', font = b.font || 'Manrope';
    const copy = c.spec.copy || {}, prod = c.spec.product || {};
    const W = 1080, H = kind === 'reel' ? 1920 : 1350;
    const face = await fontFace(font), img = await imgData(prod.image_url).catch(() => null);
    const handle = b.instagram ? '@' + b.instagram.replace('@', '') : (b.name || '');
    const photo = img ? `<image href="${img}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>` : `<rect width="${W}" height="${H}" fill="${S}"/>`;
    // Regras em lib/playbook.js: hook = título, body = subtítulo, CTA = a foto do produto. Sem botão, preço em pílula, @ ou "deslize" na arte.
    const band = (hook, sub, y0, bg, hw = 16, hs = 72) => {
      const hl = wrap(hook, hw), sl = wrap(sub, 40), fg = readable(bg);
      const h = 96 + hl.length * hs * 1.12 + (sl.length ? 24 + sl.length * 46 : 0) + 56;
      const y = y0 === 'bottom' ? H - h : y0;
      return { h, svg: `<rect x="0" y="${y}" width="${W}" height="${h}" fill="${bg}"/>${textLines(hl, 72, y + 96 + hs * 0.2, hs, fg)}${sl.length ? textLines(sl, 72, y + 96 + hl.length * hs * 1.12 + 40, 40, fg, 'start', 500) : ''}` };
    };
    let body = '';
    if (kind === 'feed') {
      body = photo + band(copy.hook || copy.headline || prod.name, copy.body || '', 'bottom', P).svg;
    } else if (kind === 'reel') {
      // capa do reels: só a foto e o gancho pequeno no alto, fora da área da interface do Instagram
      const hl = wrap(copy.hook || copy.title || '', 22);
      body = `${photo}<defs><filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000" flood-opacity=".55"/></filter></defs><g filter="url(#sh)">${textLines(hl, W / 2, 300, 56, '#FFFFFF', 'middle')}</g>`;
    } else {
      const s = (copy.slides || [])[i] || { title: prod.name, body: '' }, n = (copy.slides || []).length || 1;
      if (i === 0) body = photo + band(s.hook || s.title, s.body, 'bottom', P).svg;
      else if (i === n - 1) body = photo + band(s.hook || s.title, s.body, 'bottom', S, 18, 64).svg;
      else {
        const top = H * 0.56;
        body = `<rect width="${W}" height="${H}" fill="${S}"/>${img ? `<image href="${img}" x="0" y="0" width="${W}" height="${top}" preserveAspectRatio="xMidYMid slice"/>` : ''}<rect x="72" y="${top + 64}" width="96" height="8" fill="${A}"/>${band(s.hook || s.title, s.body, top + 20, S, 18, 64).svg.replace(/^<rect[^>]*\/>/, '')}<text x="${W - 72}" y="${H - 56}" font-size="28" font-weight="500" fill="${readable(S)}" opacity=".6" text-anchor="end">${i + 1}/${n}</text>`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="'${font}', Manrope, sans-serif"><style>${face}</style>${body}</svg>`;
  }
  async function drawSlides(pv, c) {
    const n = c.format === 'carousel' ? (c.spec.copy?.slides || []).length || 1 : 1;
    const svgs = []; for (let i = 0; i < n; i++) svgs.push(await svgFor(c, c.format === 'carousel' ? 'carousel' : 'feed', i));
    pv.innerHTML = `<div class="${n > 1 ? 'slides' : ''}">${svgs.map(s => `<div class="frame">${s}</div>`).join('')}</div><p class="micro">${esc(c.spec.copy?.caption || '')}${c.spec.copy?.hashtags ? '<br>' + esc(c.spec.copy.hashtags.join(' ')) : ''}</p>`;
    pv.dataset.svgs = JSON.stringify(svgs);
  }
  async function drawReel(pv, c) {
    const cover = await svgFor(c, 'reel', 0);
    const vid = c.output_key ? '/media/' + c.output_key : c.output_url;
    const status = c.status;
    let media;
    if (vid && (status === 'completed' || status === 'approved')) media = `<div class="frame"><video src="${vid}" controls playsinline loop muted autoplay poster=""></video></div>`;
    else if (status === 'failed') media = `<div class="frame"><p class="hint" style="padding:16px">A geração do vídeo falhou: ${esc(c.error || 'erro no provedor')}. A capa e a legenda continuam valendo.</p></div>`;
    else if (c.spec.mock) media = `<div class="frame kb"><img src="${await imgData(c.spec.product.image_url).catch(() => '/assets/iris-mark.png')}" alt=""></div><p class="fine">Prévia animada. O vídeo real é gerado quando a chave do Higgsfield estiver configurada.</p>`;
    else media = `<div class="frame kb"><img src="${await imgData(c.spec.product.image_url).catch(() => '/assets/iris-mark.png')}" alt=""><span class="t">Gerando o vídeo…</span></div><p class="fine">Costuma levar de 1 a 3 minutos. A página atualiza sozinha.</p>`;
    pv.innerHTML = `${media}<div class="row"><div class="frame" style="width:40%">${cover}</div><div class="stack" style="flex:1;min-width:0"><p class="micro"><b>Gancho:</b> ${esc(c.spec.copy?.hook || '')}</p><p class="micro">${esc(c.spec.copy?.caption || '')}</p></div></div>`;
    pv.dataset.svgs = JSON.stringify([cover]);
  }
  async function uploadJpeg(svg) {
    const blob = dataUrlToBlob(await svgToPng(svg, 'image/jpeg'));
    const up = await fetch('/api/upload', { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: blob }).then(r => r.json());
    if (!up.ok) throw new Error(up.message || 'Falha ao preparar a imagem.');
    return up.url;
  }
  async function publishToIg(box, c) {
    const svgs = JSON.parse($('#pv', box).dataset.svgs || '[]');
    toast('Preparando as imagens…');
    const urls = []; for (const s of svgs) urls.push(await uploadJpeg(s));
    const body = c.format === 'reel' ? { cover_url: urls[0] } : { image_urls: urls };
    toast('Enviando para o Instagram…', 8000);
    for (let i = 0; i < 12; i++) {
      const r = await api('/contents/' + c.id + '/publish', { method: 'POST', body });
      if (!r.pending) { toast('Publicado no Instagram.', 4000); return r; }
      await new Promise(res => setTimeout(res, 8000));
    }
    throw new Error('O Instagram ainda está processando o vídeo. Tente publicar de novo em alguns minutos.');
  }
  async function downloadAll(box, c) {
    const svgs = JSON.parse($('#pv', box).dataset.svgs || '[]');
    for (let i = 0; i < svgs.length; i++) {
      const png = await svgToPng(svgs[i]);
      const a = document.createElement('a'); a.href = png; a.download = `${slug(c.spec.brand?.name)}-${c.format}-${i + 1}.png`; document.body.appendChild(a); a.click(); a.remove();
      await new Promise(r => setTimeout(r, 400));
    }
    toast(svgs.length > 1 ? `${svgs.length} imagens baixadas.` : 'Imagem baixada.');
  }
  function svgToPng(svg, type = 'image/png') {
    return new Promise((res, rej) => {
      const img = new Image(); const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      img.onload = () => { const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; cv.getContext('2d').drawImage(img, 0, 0); URL.revokeObjectURL(url); try { if (type === 'image/jpeg') { const x = cv.getContext('2d'); x.globalCompositeOperation = 'destination-over'; x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); } res(cv.toDataURL(type, 0.92)); } catch (e) { rej(e); } };
      img.onerror = () => rej(new Error('Falha ao montar a imagem.')); img.src = url;
    });
  }
  const slug = s => String(s || 'Íris').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Íris';

  /* ---------- plano ---------- */
  async function viewPlan() {
    const plans = me.plans, cur = me.user.plan;
    main.innerHTML = `<div class="stack"><span class="eyebrow">Configurações</span><h1>Escopo semanal, preço claro.</h1><p class="lead">Mude quando quiser. O gratuito continua para sempre.</p></div>
      <nav class="subnav"><a href="#/conta">Marca e integrações</a><a href="#/plano" aria-current="page">Plano e pagamento</a></nav>
      ${me.billing?.until && cur !== 'free' ? `<p class="micro">Seu plano vale até ${new Date(me.billing.until).toLocaleDateString('pt-BR')}${me.billing.source === 'pix' ? ', pago com Pix. Renove antes para não perder o ritmo.' : '.'}</p>` : ''}
      ${payBar()}
      <div class="plans">${Object.entries(plans).map(([k, p]) => `<div class="plan ${k === cur ? 'on' : ''}"><h3>${esc(p.name)}</h3><div class="price">${p.price ? priceLabel(p) : 'R$ 0<small>/mês</small>'}</div><ul>${p.perks.map(x => `<li>${esc(x)}</li>`).join('')}</ul>${k === cur ? '<span class="tag ok">seu plano</span>' : k === 'free' ? '' : `<button class="btn btn-primary" data-plan="${k}"><span class="spin"></span>Assinar ${esc(p.name)}</button>`}${k === cur && me.billing?.source === 'pix' ? `<button class="btn btn-ghost" data-plan="${k}"><span class="spin"></span>Renovar com Pix</button>` : ''}</div>`).join('')}</div>
      <p class="fine">Posts: feed ou carrossel. Reels: vídeo de até 5 s gerado a partir da foto, com capa e legenda. Limites por mês = semana × 4.</p>`;
    bindPay(viewPlan, 'plano');
  }

  /* ---------- conta ---------- */
  async function viewAccount(r) {
    const b = me.brand || { colors: {} };
    main.innerHTML = `<div class="stack"><span class="eyebrow">Configurações</span><h1>Sua marca</h1><p class="lead">${esc(me.user.email)}</p></div>
      <nav class="subnav"><a href="#/conta" aria-current="page">Marca e integrações</a><a href="#/plano">Plano e pagamento</a></nav>
      <form class="card" id="f">${brandForm(b, null, true)}<button class="btn btn-primary btn-block" type="submit">Salvar</button></form>
      <div class="card" id="wa"><h3>WhatsApp</h3>${me.user.phone ? `<p class="lead">Conectado: ${esc(me.user.phone)}. Mande a foto de um produto com nome e preço na legenda.</p>` : me.whatsapp ? `<p class="lead">Mande a foto, receba o post. Conecte seu número em dois passos.</p><button class="btn btn-ghost" id="wa-code">Gerar código</button><div id="wa-out"></div>` : `<p class="lead">Mande a foto pelo WhatsApp e receba o post pronto. Disponível no plano Pro, em breve neste ambiente.</p>`}</div>
      <div class="card" id="ig"><h3>Instagram</h3>${igCard('conta')}${me.instagram?.account ? '<button class="btn btn-ghost btn-sm" id="ig-off">Desconectar</button>' : ''}</div>
      <button class="btn btn-ghost btn-block" id="out">Sair</button>`;
    bindBrandForm();
    if (r?.q?.get('ig')) igToast(r.q.get('ig'));
    if ($('#ig-off')) $('#ig-off').onclick = async () => { await api('/instagram', { method: 'DELETE' }); await loadMe(); toast('Instagram desconectado.'); viewAccount(); };
    $('#f').onsubmit = async e => { e.preventDefault(); await api('/brand', { method: 'PUT', body: readBrandForm(b) }); await loadMe(); toast('Marca salva.'); };
    if ($('#wa-code')) $('#wa-code').onclick = async () => { const d = await api('/wa/code', { method: 'POST' }); $('#wa-out').innerHTML = `<p class="lead">Envie <b>${esc(d.text)}</b> para <b>${esc(d.phone || 'o número da Íris')}</b>. Vale por 30 minutos.</p>`; };
    $('#out').onclick = async () => { await api('/auth/logout', { method: 'POST' }); me = null; ss.del('iris-onb'); location.hash = '#/start'; };
  }
  function viewLogin(r) {
    if (r?.q?.get('google')) googleToast(r.q.get('google'));
    if (me.user) { location.hash = me.brand ? '#/home' : '#/start'; return; }
    main.innerHTML = `<div class="stack center"><img class="mark" src="/assets/iris-mark.png" alt=""><h1>Entrar na Íris</h1><p class="lead">Entre com o Google ou receba um código de 6 dígitos no e-mail.</p></div>
      <form class="card" id="f">${googleBtn('login')}<div class="field"><label for="email">E-mail</label><input class="input" id="email" type="email" inputmode="email" autocomplete="email"></div><p class="hint" id="h"></p><button class="btn btn-primary btn-block" type="submit"><span class="spin"></span>Receber código</button></form>`;
    $('#f').onsubmit = async e => { e.preventDefault(); const email = $('#email').value.trim(); const btn = $('#f button[type=submit]'); busy(btn, true); try { const d = await api('/auth/request', { method: 'POST', body: { email } }); codeForm(email, d.dev_code, async () => { await loadMe(); location.hash = me.brand ? '#/home' : '#/start'; render(); }); } catch (err) { $('#h').textContent = err.message; busy(btn, false); } };
  }

  /* ---------- util ---------- */
  const readPhoto = f => fileToDataUrl(f, 1600).catch(e => { toast(e.message, 6000); e.target && (e.target.value = ''); throw e; });
  function fileToDataUrl(file, max) {
    return new Promise((res, rej) => { const img = new Image(); const u = URL.createObjectURL(file); img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u); res(cv.toDataURL('image/jpeg', 0.88)); }; img.onerror = () => rej(new Error(/hei[cf]/i.test(file.type + file.name) ? 'Foto em HEIC do iPhone: no computador, salve como JPG. Pelo celular funciona direto.' : 'Não consegui ler a foto. Use JPG, PNG ou WebP.')); img.src = u; });
  }
  function dataUrlToBlob(d) { const [h, b] = d.split(','); const mime = /data:([^;]+)/.exec(h)[1]; const bin = atob(b); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new Blob([arr], { type: mime }); }

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/app/sw.js').catch(() => { });
  render();
})();
