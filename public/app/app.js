/* Íris app: onboarding, criação, aprovação e download. Vanilla JS, sem build. */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s), $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const main = $('#main'), top = $('#top');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FONTS = ['Manrope', 'Poppins', 'Montserrat', 'DM Sans', 'Nunito', 'Playfair Display', 'DM Serif Display', 'Lora', 'Cormorant Garamond', 'Bebas Neue'];
  const FORMAT = { feed: 'Post no feed', carousel: 'Carrossel', reel: 'Reels' };

  /* ---------- ícones (Lucide, ISC) e logos reais ---------- */
  const I = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    images: '<path d="M18 22H4a2 2 0 0 1-2-2V6"/><path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18"/><circle cx="12" cy="8" r="2"/><rect width="16" height="16" x="6" y="2" rx="2"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    reel: '<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    carousel: '<path d="M2 3v18"/><rect width="12" height="18" x="6" y="3" rx="2"/><path d="M22 3v18"/>',
    store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    card: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
    play: '<path d="m6 3 14 9-14 9z"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    wand: '<path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    instagram: '<rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
  };
  const ic = (n, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`;
  // logos oficiais (traçados dos ícones públicos das marcas; os mesmos do site)
  const LOGO = {
    instagram: '<path fill="currentColor" d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>',
    whatsapp: '<path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>',
    pix: '<path fill="currentColor" d="M15.9 17.2c-.8 0-1.6-.3-2.2-.9l-3.1-3.1a.6.6 0 0 0-.8 0l-3.1 3.1c-.6.6-1.4.9-2.2.9h-.6l3.9 3.9a3.2 3.2 0 0 0 4.5 0l3.9-3.9zM4.5 6.8c.8 0 1.6.3 2.2.9l3.1 3.1c.2.2.6.2.8 0l3.1-3.1c.6-.6 1.4-.9 2.2-.9h.6L12.6 2.9a3.2 3.2 0 0 0-4.5 0L4 6.8zm16.6 2.9-2.4-2.4h-1.3c-.5 0-1.1.2-1.5.6l-3.1 3.1c-.3.3-.7.4-1 .4s-.7-.1-1-.4L7.7 7.9c-.4-.4-.9-.6-1.5-.6H4.9L2.6 9.7a3.2 3.2 0 0 0 0 4.5l2.3 2.3h1.3c.5 0 1.1-.2 1.5-.6l3.1-3.1c.5-.5 1.5-.5 2 0l3.1 3.1c.4.4.9.6 1.5.6h1.3l2.4-2.4a3.2 3.2 0 0 0 0-4.4z"/>',
    google: '<path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z"/><path fill="#FBBC05" d="M5.3 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l3.9-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.5l3.9 3.1c1-2.8 3.6-4.8 6.7-4.8z"/>',
  };
  const logo = (n, cls = '') => `<svg class="lg${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${LOGO[n]}</svg>`;
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
  async function loadMe() { me = (await api('/me')); holdy(); return me; }
  // Holdy (análise de produto): quem é a pessoa e qual loja; sem SDK ou bloqueado, não faz nada
  function holdy() { try { const H = window.Holdy; if (!H || !me?.user) return; H.identify(me.user.id, { email: me.user.email || undefined, plan: me.user.plan }); H.group(me.user.id, { name: me.brand?.name || me.user.email || me.user.id, plan: me.user.plan, instagram: me.brand?.instagram || undefined, lp: ss.get('iris-lp') || undefined }); } catch { } }
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
  const STEP_LABELS = { 3: ['Foto', 'Peça', 'Conta'], 4: ['Site', 'Marca', 'Produto', 'Conta'] };
  function stepsBar(n, total = 4) { const L = STEP_LABELS[total] || []; return `<ol class="steps" aria-label="Etapa ${n} de ${total}">${Array.from({ length: total }, (_, i) => i + 1).map(i => `<li class="${i < n ? 'done' : i === n ? 'on' : ''}"><i></i><span>${L[i - 1] || ''}</span></li>`).join('')}</ol>`; }

  async function viewStart(r) {
    const o = ONB.get();
    if (r.q.get('lp')) ss.set('iris-lp', r.q.get('lp').replace(/[^a-z0-9-]/gi, '').slice(0, 30));
    if (r.q.get('beta') === 'ig') try { localStorage.setItem('iris-beta-ig', '1'); } catch {}
    const loja = r.q.get('loja') || ss.get('iris-loja') || o.store || '';
    // @ vindo da landing só guarda o Instagram da loja; quem tem site cai na leitura do catálogo
    if (loja && !/\./.test(loja) && !o.brand?.instagram) { o.brand = { ...(o.brand || {}), instagram: loja.replace(/^@/, '').trim() }; o.store = ''; ONB.set(o); }
    else if (loja && /\./.test(loja) && !o.store) { o.store = loja; ONB.set(o); }
    if (me.user && me.brand && !o.step) { location.hash = '#/home'; return; }
    const step = o.step || (o.store ? 'analyze' : 'store');
    const igQ = r.q.get('ig'), sacQ = r.q.get('sacolinha');
    if (igQ === 'ok' && o.step === 'ig' && me.brand) { ss.del('iris-onb'); location.hash = '#/home'; return; }
    if (igQ === 'ok' && o.step === 'ig') { history.replaceState(null, '', location.pathname + '#/start'); return stepIgImport(o); }
    if (sacQ) { history.replaceState(null, '', location.pathname + '#/start');
      if (sacQ === 'ok') return stepSacolinha(o);
      toast({ sem_catalogo: 'Não achei uma loja do Instagram com catálogo nessa conta.', sem_conta: 'Essa conta do Facebook não tem Instagram comercial ligado.', cancelado: 'Importação cancelada.' }[sacQ] || 'Não consegui abrir a sacolinha. Tente de novo.', 4500); }
    if (igQ) igToast(igQ);
    if (r.q.get('google')) googleToast(r.q.get('google'));
    if (step === 'store') return stepStore(o);
    if (step === 'ig') return stepStore({ ...o, step: 'store' });
    if (step === 'analyze') return stepAnalyze(o);
    if (step === 'details') return stepDetails(o);
    if (step === 'brand') return stepBrand(o);
    if (step === 'product') return stepProduct(o);
    if (step === 'auth') return stepAuth(o);
    if (step === 'generate') return stepGenerate(o);
    if (step === 'offer') return stepOffer(o);
    if (step === 'result') return stepResult(o);
    if (step === 'instagram') return stepInstagram(o, r);
  }
  const igBeta = () => { try { return !!(me?.instagram?.enabled && (me.instagram.signup || localStorage.getItem('iris-beta-ig'))); } catch { return false; } };
  // Padrões da loja pequena de moda feminina em que a dona vende, atende e posta: ela ajusta depois em Configurações.
  const FASHION = { tone: 'Próximo, animado e direto, como a dona da loja falando com a cliente. Fala de caimento, combinação e ocasião de uso.', icp: 'Mulheres de 20 a 45 anos que seguem a loja no Instagram e compram a novidade quando veem a peça no look.', occasions: 'Trabalho, fim de semana, eventos e viagens' };
  const shootBtns = () => `<div class="shoot">
      <label class="shoot-main"><input class="sr" type="file" accept="image/*" data-shot>${ic('images')}<b>Escolher da galeria</b><small>A foto da novidade que você já tirou</small></label>
      <label class="shoot-cam"><input class="sr" type="file" accept="image/*" capture="environment" data-shot>${ic('camera')}<b>Tirar foto</b></label></div>`;
  // como funciona + o que a pessoa não precisa fazer: cria confiança antes do primeiro toque
  const howStrip = (site = false) => `<ol class="how">
      <li>${ic(site ? 'globe' : 'camera')}<b>${site ? 'Cole o site' : 'Uma foto'}</b>${site ? 'da sua loja' : 'da peça'}</li>
      <li>${ic('tag')}<b>Nome e preço</b>só o que vai no post</li>
      <li>${ic('sparkles')}<b>Carrossel e reels</b>prontos para postar</li></ol>
    <p class="trust"><span>${ic('clock')}Leva 1 minuto</span><span>${ic('lock')}Sem senha</span><span>${ic('card')}Sem cartão</span></p>`;
  const isDesktop = () => matchMedia('(hover:hover) and (pointer:fine)').matches;
  // Entrada principal: uma foto do celular. O site é a alternativa para loja com catálogo; o Instagram vem depois do primeiro conteúdo.
  // No computador a entrada é só pelo site: a foto da novidade está no celular.
  function stepStore(o) {
    if (isDesktop()) return stepStoreDesktop(o);
    main.innerHTML = `<div class="hello"><img class="mark" src="/assets/iris-mark.png" alt=""><p class="bubble">Oi, eu sou a Íris. Me mostra uma peça nova que eu crio o post da sua loja.</p></div>
      <div class="stack center"><h1>Mostre uma peça nova.</h1><p class="lead">Uma foto do celular vira carrossel e reels com a cara da sua loja. No cabide, no manequim ou vestida.</p></div>
      ${shootBtns()}
      <button class="site-alt" type="button" id="site-open"><span class="oi">${ic('globe')}</span><span><b>Tenho site com catálogo</b><small>Puxo logo, cores e produtos com preço</small></span></button>
      ${howStrip()}
      <form class="card" id="f" hidden><div class="field"><label for="site">Site da loja</label><input class="input" id="site" placeholder="sualoja.com.br" inputmode="url" autocapitalize="none" value="${esc(/\./.test(o.store || '') ? o.store : '')}"></div>
        <p class="hint" id="hs"></p><button class="btn btn-primary btn-block" type="submit">Ler meu site</button></form>
      ${me.user ? '' : '<p class="micro center">Já tem conta? <a href="#/login">Entrar</a></p>'}`;
    bindShot(o);
    const openSite = () => { $('#f').hidden = false; $('#site-open').hidden = true; $('#site').focus(); };
    $('#site-open').onclick = openSite;
    if (/\./.test(o.store || '')) openSite();
    $('#f').onsubmit = e => { e.preventDefault(); const v = $('#site').value.trim(); if (!/\.[a-z]{2,}/i.test(v)) { $('#hs').textContent = 'Cole o endereço do site, como sualoja.com.br.'; return; } ONB.set({ ...o, store: v, step: 'analyze' }); render(); };
  }
  function stepStoreDesktop(o) {
    main.innerHTML = `<div class="hello"><img class="mark" src="/assets/iris-mark.png" alt=""><p class="bubble">Oi, eu sou a Íris. Me passa o site da loja que eu leio a marca e crio o primeiro post.</p></div>
      <div class="stack center"><h1>Cole o site da sua loja.</h1><p class="lead">Leio logo, cores, fonte e o catálogo com preços, e crio seu primeiro carrossel e reels.</p></div>
      <form class="card" id="f"><div class="field"><label for="site">Site da loja</label><input class="input" id="site" placeholder="sualoja.com.br" inputmode="url" autocapitalize="none" value="${esc(/\./.test(o.store || '') ? o.store : '')}"></div>
        <p class="hint" id="hs"></p><button class="btn btn-primary btn-block" type="submit">${ic('sparkles')}Ler meu site</button></form>
      ${howStrip(true)}
      <p class="micro center">${ic('phone', 'sm')} Não tem site? Abra <b>${esc(location.host)}/app</b> no celular e comece por uma foto da galeria.</p>
      ${me.user ? '' : '<p class="micro center">Já tem conta? <a href="#/login">Entrar</a></p>'}`;
    $('#site').focus();
    $('#f').onsubmit = e => { e.preventDefault(); const v = $('#site').value.trim(); if (!/\.[a-z]{2,}/i.test(v)) { $('#hs').textContent = 'Cole o endereço do site, como sualoja.com.br.'; return; } ONB.set({ ...o, store: v, step: 'analyze' }); render(); };
  }
  // Foto escolhida: as cores da marca saem dela e o próximo passo pede só o essencial.
  function bindShot(o) {
    $$('[data-shot]').forEach(inp => inp.onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      $$('.shoot label').forEach(l => l.setAttribute('aria-busy', 'true'));
      try {
        const data = await readPhoto(f), pal = await photoPalette(data).catch(() => null), b = o.brand || {};
        ONB.set({ ...o, store: '', file_data: data, product: { name: o.product?.name || '', price: o.product?.price || '' },
          brand: { font: 'Manrope', tone: FASHION.tone, icp: FASHION.icp, ...b, name: b.name || '', colors: pal?.colors || b.colors || { primary: '#1F140D', secondary: '#FFFFFF', accent: '#FFD83A' }, strategy: { close_channel: 'whatsapp', emoji: true, occasions: FASHION.occasions, ...(b.strategy || {}) } },
          products: [], meta: { photo_first: true, no_site: true, colors_from: pal ? 'foto da peça' : null }, step: 'details' });
        track('foto');
        render(); scrollTo(0, 0);
      } catch { $$('.shoot label').forEach(l => l.removeAttribute('aria-busy')); }
    });
  }
  function stepDetails(o) {
    if (!o.file_data) { ONB.set({ ...o, step: 'store' }); return render(); }
    const b = o.brand || {}, c = b.colors || {}, st = b.strategy || {}, p = o.product || {};
    const chans = [['whatsapp', 'WhatsApp', logo('whatsapp', 'c-wa')], ['direct', 'Direct', logo('instagram', 'c-ig')], ['loja', 'Loja física', ic('store')], ['site', 'Site', ic('globe')]];
    main.innerHTML = `${stepsBar(2, 3)}<div class="stack"><span class="eyebrow">Sua novidade</span><h1>Agora me conta da peça.</h1><p class="lead">Só o que vai no post. O resto eu deixo pronto.</p></div>
      <form class="card" id="f">
        <div class="piece"><label class="piece-img" title="Trocar foto"><input class="sr" type="file" accept="image/*" id="swap"><img src="${o.file_data}" alt="Foto da peça"><small>Trocar</small></label>
          <div class="stack" style="gap:8px"><span class="lbl">Cores da marca</span><div class="row sw-mini">${[['primary', 'Principal'], ['secondary', 'Fundo'], ['accent', 'Destaque']].map(([k, l]) => `<label class="swatch"><input type="color" id="c-${k}" value="${esc(c[k] || '#1F140D')}" aria-label="Cor ${l.toLowerCase()}"></label>`).join('')}</div>
          <p class="fine">${o.meta?.colors_from ? 'Tiradas da foto. Toque para trocar.' : 'Toque para escolher.'}</p></div></div>
        <div class="sect"><span class="sect-t">${ic('tag')}A peça</span>
        <div class="field"><label for="p-name">Nome da peça</label><input class="input" id="p-name" value="${esc(p.name || '')}" placeholder="Ex.: Vestido midi de linho" autocomplete="off"></div>
        <div class="field"><label for="p-price">Preço</label><input class="input" id="p-price" value="${esc(p.price || '')}" placeholder="R$ 189" inputmode="decimal"></div>
        <div class="field"><label for="p-offer">Condição ou oferta (opcional)</label><input class="input" id="p-offer" value="${esc(o.offer || '')}" placeholder="3x sem juros, frete grátis, só até domingo"></div></div>
        <div class="sect"><span class="sect-t">${ic('store')}Sua loja</span>
        <div class="field"><label for="b-name">Nome da loja</label><input class="input" id="b-name" value="${esc(b.name || '')}" placeholder="Ex.: Closet da Ju" autocomplete="organization"></div>
        <div class="field"><span class="lbl">Onde você fecha a venda</span><div class="chips">${chans.map(([k, l, i]) => `<button class="chip" type="button" data-chan="${k}" aria-pressed="${st.close_channel === k}">${i}${l}</button>`).join('')}</div></div></div>
        <p class="hint" id="h"></p>
        <button class="btn btn-primary btn-block btn-lg" type="submit">${ic('sparkles')}Criar meu carrossel e reels</button>
        <button class="btn btn-ghost btn-block" type="button" id="back">${ic('back')}Voltar</button></form>`;
    $$('[data-chan]').forEach(x => x.onclick = () => $$('[data-chan]').forEach(y => y.setAttribute('aria-pressed', String(y === x))));
    const read = () => ({ ...o, product: { name: $('#p-name').value.trim(), price: $('#p-price').value.trim() }, offer: $('#p-offer').value.trim(),
      brand: { ...b, name: $('#b-name').value.trim(), colors: { primary: $('#c-primary').value, secondary: $('#c-secondary').value, accent: $('#c-accent').value }, strategy: { ...st, close_channel: $('[data-chan][aria-pressed="true"]')?.dataset.chan || st.close_channel || null } } });
    $('#swap').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const data = await readPhoto(f), pal = await photoPalette(data).catch(() => null), n = read(); ONB.set({ ...n, file_data: data, brand: pal && o.meta?.colors_from ? { ...n.brand, colors: pal.colors } : n.brand }); render(); } catch { } };
    if (!p.name) $('#p-name').focus();
    $('#f').onsubmit = e => { e.preventDefault(); const n = read();
      if (!n.product.name) { $('#h').textContent = 'Dê um nome à peça.'; $('#p-name').focus(); return; }
      if (n.brand.name.length < 2) { $('#h').textContent = 'Digite o nome da loja.'; $('#b-name').focus(); return; }
      track('peca'); ONB.set({ ...n, step: me.user ? 'generate' : 'auth' }); render(); scrollTo(0, 0); };
    $('#back').onclick = () => { ONB.set({ ...read(), step: 'store' }); render(); };
  }
  // Volta do login do Instagram: lê perfil, cores da foto do perfil, posts e, se houver, o site da bio.
  async function stepIgImport(o) {
    await loadMe();
    main.innerHTML = `${stepsBar(1)}<div id="run"></div>`;
    const R = runPanel($('#run'), { title: 'Lendo seu Instagram', tasks: [{ id: 'conn', label: 'Conectar sua conta' }, { id: 'prof', label: 'Ler seu perfil' }, { id: 'cores', label: 'Tirar as cores da foto do perfil' }, { id: 'posts', label: 'Separar seus posts com produto' }, { id: 'site', label: 'Ler o site da bio' }, { id: 'marca', label: 'Montar sua marca' }] });
    R.done('conn', me.instagram?.account ? '@' + me.instagram.account.username : 'Conectado');
    try {
      R.run('prof'); const { profile: pf } = await api('/instagram/profile');
      R.done('prof', [pf.name || pf.username, pf.followers != null ? nf(pf.followers) + ' seguidores' : null].filter(Boolean).join(' · '));
      R.run('cores'); let colors = null;
      if (pf.picture) { const pal = await logoPalette([pf.picture], null, []).catch(() => null) || await photoPalette('/api/img?u=' + encodeURIComponent(pf.picture)).catch(() => null); colors = pal?.colors || null; }
      colors ? R.done('cores', 'Paleta tirada da foto do perfil') : R.skip('cores', 'Sem foto de perfil: as cores saem da foto do produto');
      R.run('posts'); const price = t => (String(t || '').match(/r\$\s?\d+(?:[.,]\d{2})?/i) || [])[0] || null;
      const fromIg = (pf.media || []).filter(m => m.image).slice(0, 12).map(m => ({ name: (m.caption || '').split(/\n|[.!?]/)[0].replace(/[#@]\S+/g, '').trim().slice(0, 60) || 'Post do Instagram', price: price(m.caption), image_url: m.image, source: 'instagram' }));
      fromIg.length ? R.done('posts', `${fromIg.length} posts com foto para escolher`) : R.skip('posts', 'Sem posts com foto ainda');
      let site = null; const web = pf.website && /\.[a-z]{2,}/i.test(pf.website) ? pf.website : null;
      if (web) { R.run('site'); site = await api('/brand/analyze', { method: 'POST', body: { store: web } }).catch(() => null); site ? R.done('site', site.meta?.catalog ? `${site.products.length} produtos com preço` : 'Lido') : R.skip('site', 'Não consegui ler o site'); }
      else R.skip('site', 'Sem site na bio');
      const b = { ...(site?.brand || {}), name: site?.brand?.name || pf.name || pf.username, instagram: pf.username, logo_url: pf.picture || site?.brand?.logo_url || null,
        colors: colors || site?.brand?.colors || { primary: '#1F140D', secondary: '#FFFFFF', accent: '#FFD83A' }, font: site?.brand?.font || 'Manrope', strategy: site?.brand?.strategy || { close_channel: 'direct', emoji: true } };
      R.done('marca', b.name); R.finish(); await pause(1000);
      ONB.set({ ...o, store: web || '', brand: b, products: [...(site?.products || []), ...fromIg], meta: { ...(site?.meta || {}), colors_from: colors ? 'foto do perfil' : null, colors_from_photo: !colors, from_ig: true }, step: 'brand' }); render();
    } catch (e) { R.fail('prof', e.message); await pause(1200); ONB.set({ ...o, step: 'store' }); render(); }
  }
  // Volta do login do Facebook: lista a sacolinha e coloca os produtos na escolha.
  async function stepSacolinha(o) {
    main.innerHTML = `${stepsBar(3)}<div id="run"></div>`;
    const R = runPanel($('#run'), { title: 'Abrindo sua sacolinha', tasks: [{ id: 'cat', label: 'Ler o catálogo da loja do Instagram' }, { id: 'sel', label: 'Separar produtos com foto e preço' }] });
    try { R.run('cat'); const d = await api('/meta/catalog'); R.done('cat', d.catalog || 'Catálogo lido'); R.done('sel', `${d.products.length} produtos disponíveis`); R.finish(); await pause(900);
      ONB.set({ ...o, products: [...d.products.map(p => ({ ...p, source: 'sacolinha' })), ...(o.products || [])], meta: { ...(o.meta || {}), catalog: 'sacolinha' }, step: 'product' }); render();
    } catch (e) { R.fail('cat', e.message); await pause(1400); ONB.set({ ...o, step: 'product' }); render(); }
  }

  /* ---------- "Íris trabalhando": lista de etapas com resultado real e transformação da foto ---------- */
  function runPanel(host, { title, tasks, photo = null, compact = false }) {
    host.innerHTML = `<div class="run ${compact ? 'compact' : ''}">
      <div class="run-head"><img class="bot working" src="/assets/iris-mark.png" alt=""><div><b>${esc(title)}</b><span class="run-count">0/${tasks.length} etapas</span></div></div>
      ${photo ? `<div class="morph"><img class="before" src="${photo}" alt=""><i class="scan" aria-hidden="true"></i><div class="after"></div></div>` : ''}
      <ol class="tasks" aria-live="polite">${tasks.map(t => `<li data-t="${t.id}" data-state="pending"><i aria-hidden="true"></i><div><span>${esc(t.label)}</span><small></small></div></li>`).join('')}</ol>
      <p class="micro run-note"></p></div>`;
    const q = sel => host.querySelector(sel), row = id => host.querySelector(`[data-t="${id}"]`);
    const count = () => { const n = host.querySelectorAll('[data-state="done"]').length; q('.run-count').textContent = `${n}/${tasks.length} etapas`; };
    return {
      run(id, note) { const r = row(id); if (r && r.dataset.state === 'pending') { r.dataset.state = 'running'; if (note) r.querySelector('small').textContent = note; } },
      done(id, result) { const r = row(id); if (!r) return; r.dataset.state = 'done'; r.querySelector('small').textContent = result || ''; count(); },
      fail(id, msg) { const r = row(id); if (!r) return; r.dataset.state = 'error'; r.querySelector('small').textContent = msg || ''; q('.bot').classList.remove('working'); },
      skip(id, msg) { const r = row(id); if (!r) return; r.dataset.state = 'skip'; r.querySelector('small').textContent = msg || ''; count(); },
      note(t) { q('.run-note').textContent = t || ''; },
      reveal(html) { const a = q('.after'); if (!a) return; a.innerHTML = html; requestAnimationFrame(() => q('.morph').classList.add('ready')); },
      finish() { const b = q('.bot'); b.classList.remove('working'); b.classList.add('done'); },
    };
  }
  const pause = ms => new Promise(r => setTimeout(r, ms));
  // funil do onboarding por página de origem: onde a jornada para (foto → peça → cadastro → instagram → valor)
  function track(evento, props) {
    try { window.Holdy?.track(evento, { lp: ss.get('iris-lp') || 'direto', ...(props || {}) }); } catch { }
    try { const b = JSON.stringify({ etapa: 'evento', evento, lp: ss.get('iris-lp') || 'direto' }); navigator.sendBeacon ? navigator.sendBeacon('/api/lead', new Blob([b], { type: 'application/json' })) : fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: b }); } catch { }
  }
  // valor = a pessoa aproveitou o conteúdo (baixou, copiou a legenda ou publicou), não só gerou
  function trackValue() { try { if (localStorage.getItem('iris-valor')) return; localStorage.setItem('iris-valor', '1'); } catch { } track('valor'); }

  async function stepAnalyze(o) {
    main.innerHTML = `${stepsBar(1)}<div id="run"></div>`;
    const host = String(o.store || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    const R = runPanel($('#run'), { title: `Lendo ${host}`, tasks: [
      { id: 'open', label: host.startsWith('@') ? 'Achar a loja pelo @' : 'Abrir o site da loja' }, { id: 'logo', label: 'Ler o logo e as cores' }, { id: 'font', label: 'Ler a fonte e o jeito de falar' },
      { id: 'cat', label: 'Encontrar o catálogo e os preços' }, { id: 'sell', label: 'Entender como você vende' }, { id: 'brand', label: 'Montar sua marca' }] });
    // o servidor faz tudo em paralelo: as etapas entram em andamento e só ficam prontas com o resultado
    const order = ['open', 'logo', 'font', 'cat', 'sell']; let k = 0; R.run('open');
    const tm = setInterval(() => { k = Math.min(k + 1, order.length - 1); R.run(order[k]); }, 900);
    try {
      const d = await api('/brand/analyze', { method: 'POST', body: { store: o.store, instagram: o.ig_handle || undefined } });
      clearInterval(tm); order.forEach(id => R.run(id));
      const m = d.meta || {}, b = d.brand || {}, st = b.strategy || {};
      if (m.site_error && m.site_error !== 'blocked') { R.fail('open', 'Não consegui abrir o site. Vamos com as suas fotos.'); }
      else R.done('open', m.site_error === 'blocked' ? 'Site protegido: usei o ícone público da marca' : (b.site_url || host).replace(/^https?:\/\//, ''));
      await pause(250);
      const pal = await logoPalette(m.logo_candidates || [], m.site_bg, m.colors_found || []).catch(() => null);
      if (pal) { b.colors = pal.colors; b.logo_url = pal.logo; m.colors_from = pal.from; R.done('logo', `Cores tiradas do ${pal.from}`); R.reveal?.(''); }
      else { m.colors_from_photo = true; R.skip('logo', 'Sem logo legível: as cores vão sair da foto do produto'); }
      const sw = $('#run [data-t="logo"] small'); if (pal && sw) sw.insertAdjacentHTML('beforeend', ` <span class="sw-inline">${['primary', 'secondary', 'accent'].map(k2 => `<i style="background:${esc(pal.colors[k2])}"></i>`).join('')}</span>`);
      await pause(250); R.done('font', `Fonte ${b.font || 'Manrope'}${b.tone ? ' · ' + b.tone.split('.')[0].toLowerCase() : ''}`);
      await pause(250); const np = (d.products || []).filter(p => p.price).length;
      if (m.catalog) R.done('cat', `${(d.products || []).length} produtos com preço lidos da loja`); else if ((d.products || []).length) R.done('cat', `${d.products.length} fotos encontradas${np ? '' : ', sem preço'}`); else R.skip('cat', 'Sem catálogo: você manda a foto no próximo passo');
      await pause(250); const TIER = { popular: 'Popular', intermediario: 'Intermediário', premium: 'Premium' }, CH = { whatsapp: 'fecha no WhatsApp', site: 'fecha no site', direct: 'fecha no direct', loja: 'fecha na loja' };
      R.done('sell', [TIER[st.price_tier], CH[st.close_channel], st.conditions].filter(Boolean).join(' · ') || 'Você confirma na próxima tela');
      await pause(250); R.done('brand', b.name || 'Pronto'); R.finish(); R.note('Confira na próxima tela. Você pode ajustar tudo.');
      await pause(1100);
      ONB.set({ ...o, brand: b, products: d.products, meta: m, step: 'brand' }); render();
    } catch (e) { clearInterval(tm); R.fail('open', e.message); await pause(900); ONB.set({ ...o, brand: { name: '', colors: { primary: '#1F140D', secondary: '#FFF9EF', accent: '#FFD83A' }, font: 'Manrope', tone: '', icp: '' }, products: [], meta: { site_error: e.message }, step: 'brand' }); render(); }
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
    const tiers = [['popular', 'Popular'], ['intermediario', 'Intermediário'], ['premium', 'Premium']], chans = [['whatsapp', 'WhatsApp', logo('whatsapp', 'c-wa')], ['site', 'Site', ic('globe')], ['direct', 'Direct', logo('instagram', 'c-ig')], ['loja', 'Loja física', ic('store')]];
    return `<div class="stack">
      ${meta?.site_error === 'blocked' ? `<p class="micro">O site da loja bloqueia leitura automática. Peguei nome e cores pelo logo público. Confira o resto.</p>` : meta?.site_error ? `<p class="micro">Não consegui ler o site (${esc(meta.site_error)}). Confira o que preenchi.</p>` : ''}
      ${meta?.site_guessed ? `<p class="micro">Achei o site da loja pelo @ e usei ele para logo, cores e produtos.</p>` : ''}
      ${meta?.need_site || meta?.no_site ? `<div class="card" style="padding:12px"><p class="micro" style="margin-top:0">Tem site? Cole aqui e eu puxo logo, cores e produtos com preço. Se não tem, siga: você manda a foto no próximo passo.</p><div class="row" style="gap:8px"><input class="input" id="b-site" placeholder="sualoja.com.br" inputmode="url" autocapitalize="none" style="flex:1"><button class="btn btn-ghost btn-sm" type="button" id="b-site-go">Puxar do site</button></div></div>` : ''}
      <div class="logo-row">${b.logo_url ? `<img src="/api/img?u=${encodeURIComponent(b.logo_url)}" alt="" onerror="this.remove()">` : ''}<div class="field" style="flex:1"><label for="b-name">Nome da marca</label><input class="input" id="b-name" value="${esc(b.name || '')}" placeholder="Nome da loja"></div></div>
      <div class="field"><span class="lbl">Cores</span>${meta?.colors_from ? `<p class="micro">Tiradas do ${esc(meta.colors_from)}.</p>` : meta?.colors_from_photo ? '<p class="micro">Vou tirar as cores da foto do produto no próximo passo. Se preferir, escolha agora.</p>' : ''}<div class="row" style="gap:16px">
        <label class="swatch"><input type="color" id="c-primary" value="${esc(c.primary || '#1F140D')}"><span>Principal</span></label>
        <label class="swatch"><input type="color" id="c-secondary" value="${esc(c.secondary || '#FFF9EF')}"><span>Fundo</span></label>
        <label class="swatch"><input type="color" id="c-accent" value="${esc(c.accent || '#FFD83A')}"><span>Destaque</span></label></div></div>
      <fieldset class="sell"><legend>${ic('tag')}Como você vende</legend>${meta?.no_site ? '' : '<p class="micro">Preenchi pelo que vi no site. Confira, isso muda o jeito de cada post vender.</p>'}
        <div class="field"><span class="lbl">Faixa de preço</span><div class="chips" id="st-tier">${tiers.map(([k, l]) => `<button class="chip" type="button" data-tier="${k}" aria-pressed="${st.price_tier === k}">${l}</button>`).join('')}</div></div>
        <div class="field"><label for="st-diff">Por que comprar com você</label><input class="input" id="st-diff" value="${esc(st.differential || '')}" placeholder="Ex.: estampas autorais e troca fácil"></div>
        <div class="field"><span class="lbl">Onde a venda fecha</span><div class="chips" id="st-chan">${chans.map(([k, l, i]) => `<button class="chip" type="button" data-chan="${k}" aria-pressed="${st.close_channel === k}">${i}${l}</button>`).join('')}</div>
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
    const b = o.brand || {}, st = b.strategy || {}, m = o.meta || {}, n = (o.products || []).length;
    const TIER = { popular: 'Popular', intermediario: 'Intermediário', premium: 'Premium' }, CH = { whatsapp: 'Fecha no WhatsApp', site: 'Fecha no site', direct: 'Fecha no direct', loja: 'Fecha na loja' };
    const chips = [TIER[st.price_tier], CH[st.close_channel], n ? `${n} produtos encontrados` : null, b.font ? `Fonte ${b.font}` : null].filter(Boolean);
    main.innerHTML = `${stepsBar(2)}<div class="stack"><span class="eyebrow">Sua marca</span><h1>Foi isso que eu entendi.</h1><p class="lead">${m.no_site ? 'Confira o nome. As cores eu tiro da foto do produto no próximo passo.' : 'Se estiver certo, é só seguir. Dá para ajustar tudo depois.'}</p></div>
      <form class="card brand-sum" id="f">
        <div class="bs-head">${b.logo_url ? `<img src="${imgSrc(b.logo_url)}" alt="" onerror="this.remove()">` : `<i style="background:${esc(b.colors?.primary || '#1F140D')}">${esc((b.name || 'L')[0].toUpperCase())}</i>`}
          <div><b>${esc(b.name || 'Sua loja')}</b>${b.instagram ? `<span>@${esc(b.instagram)}</span>` : ''}</div>
          ${m.no_site ? '' : `<span class="bs-sw">${['primary', 'secondary', 'accent'].map(k => `<i style="background:${esc(b.colors?.[k] || '#ccc')}"></i>`).join('')}</span>`}</div>
        ${chips.length ? `<div class="chips bs-chips">${chips.map(c => `<span class="chip" aria-pressed="false">${esc(c)}</span>`).join('')}</div>` : ''}
        <details ${m.no_site ? 'open' : ''}><summary class="btn btn-ghost btn-sm">Ajustar detalhes</summary><div class="stack" style="padding-top:14px">${brandForm(b, m)}</div></details>
        <button class="btn btn-primary btn-block" type="submit">Isso é a minha marca</button><button class="btn btn-ghost btn-block" type="button" id="back">Voltar</button></form>`;
    bindBrandForm();
    $('#f').onsubmit = e => { e.preventDefault(); const nb = readBrandForm(b); const norm = c => ['primary', 'secondary', 'accent'].map(k => String(c?.[k] || '').toLowerCase()).join(), same = norm(nb.colors) === norm(b.colors);
      ONB.set({ ...o, brand: { ...nb, colors_pending: !!m.colors_from_photo && same }, step: 'product' }); render(); };
    $('#back').onclick = () => { ONB.set({ store: '' }); render(); };
    if ($('#b-site-go')) $('#b-site-go').onclick = () => { const v = $('#b-site').value.trim(); if (v.length < 4) { $('#b-site').focus(); return; } ONB.set({ store: v, ig_handle: b.instagram || null, step: 'analyze' }); render(); };
  }
  function stepProduct(o) {
    const prods = o.products || [];
    const sel = o.product || {};
    main.innerHTML = `${stepsBar(3)}<div class="stack"><span class="eyebrow">Primeiro conteúdo</span><h1>Qual produto vamos lançar?</h1><p class="lead">${o.meta?.from_ig ? 'Escolha um post seu ou mande uma foto nova.' : 'Mande uma foto do celular. Pode ser da galeria ou tirada agora.'}</p></div>
      <form class="card" id="f">
        ${igBeta() && me.user && me.sacolinha?.enabled && o.meta?.catalog !== 'sacolinha' ? '<button class="sac-cta" type="button" id="sac"><span class="oi ig"><svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg></span><span><b>Importar da sacolinha do Instagram</b><small>Traz fotos, nomes e preços da sua loja</small></span></button>' : ''}
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
    let picked = sel.image_url ? { image_url: sel.image_url, name: sel.name, price: sel.price, source: sel.source } : null, file = o.file_data ? { data: o.file_data } : null;
    $$('.pick[data-i]').forEach(b => b.onclick = () => { $$('.pick').forEach(x => x.setAttribute('aria-pressed', 'false')); $('#up').removeAttribute('aria-pressed'); if (file) { file = null; $('#up-in').innerHTML = '<b>Enviar foto da galeria ou câmera</b><small>JPG, PNG ou foto do iPhone</small>'; } b.setAttribute('aria-pressed', 'true'); const p = prods[+b.dataset.i]; picked = { image_url: p.image_url, name: p.name, price: p.price, source: p.source }; file = null; if (!$('#p-name').value) $('#p-name').value = p.name === 'Produto' ? '' : p.name; if (p.price && !$('#p-price').value) $('#p-price').value = p.price; });
    if (file) $('#up').setAttribute('aria-pressed', 'true');
    $('#file').onchange = async e => { const f = e.target.files[0]; if (!f) return; const data = await readPhoto(f); file = { data, type: 'image/jpeg' }; picked = null; $$('.pick').forEach(x => x.setAttribute('aria-pressed', 'false')); $('#up-in').innerHTML = `<img src="${data}" alt=""><small>Toque para trocar</small>`; $('#up').setAttribute('aria-pressed', 'true'); $('#p-name').focus(); };
    $('#f').onsubmit = async e => { e.preventDefault(); const name = $('#p-name').value.trim(); if (!picked && !file) { $('#h').textContent = 'Envie uma foto do produto.'; return; } if (!name) { $('#h').textContent = 'Dê um nome ao produto.'; $('#p-name').focus(); return; }
      // sem logo: as cores da marca saem da foto do produto
      let brand = o.brand;
      if (brand?.colors_pending) { const pal = await photoPalette(file?.data || picked.image_url).catch(() => null); if (pal) brand = { ...brand, colors: pal.colors, colors_pending: false }; }
      ONB.set({ ...o, brand, product: { ...(picked || {}), name, price: $('#p-price').value.trim() }, file_data: file?.data || null, offer: $('#p-offer').value.trim(), step: me.user ? 'generate' : 'auth' }); render(); };
    $('#back').onclick = () => { ONB.set({ ...o, step: 'brand' }); render(); };
    if ($('#sac')) $('#sac').onclick = () => { ONB.set({ ...o, step: 'product' }); location.href = '/api/meta/connect?back=start'; };
  }
  const emailOn = () => me?.email_login !== false;
  const googleBtn = back => me?.google ? `<a class="btn btn-google btn-block" href="/api/auth/google?back=${back}">${logo('google')}Continuar com Google</a>${emailOn() ? '<p class="or"><span>ou com seu e-mail</span></p>' : ''}` : '';
  // campo de e-mail só quando o envio do código está ligado; sem Google nem e-mail, explica em vez de deixar um botão que não funciona
  const emailFields = (value = '') => emailOn() ? `<div class="field"><label for="email">E-mail</label><input class="input" id="email" type="email" inputmode="email" autocomplete="email" placeholder="voce@sualoja.com.br" value="${esc(value)}"></div><p class="hint" id="h"></p><button class="btn btn-primary btn-block" type="submit"><span class="spin"></span>Receber código</button>` : me?.google ? '<p class="hint" id="h"></p>' : '<p class="hint" id="h">O login ainda não está liberado neste ambiente. Tente de novo mais tarde.</p>';
  const loginLead = () => emailOn() ? (me?.google ? 'Entre com o Google em um toque, ou receba um código no e-mail.' : 'Receba um código de 6 dígitos no e-mail.') : 'Entre com o Google em um toque.';
  function googleToast(v) {
    const m = { cancelado: 'Login com Google cancelado.', invalido: 'O login expirou. Tente de novo.', erro: 'Não consegui entrar com o Google. Tente de novo ou use o e-mail.', sem_email: 'Essa conta Google não tem e-mail verificado.', off: 'Login com Google ainda não está ativo.' }[v];
    if (m) toast(m, 4500);
    history.replaceState(null, '', location.pathname + location.hash.replace(/[?&]google=[^&]*/, ''));
  }
  function stepAuth(o) {
    if (me.user) { ONB.set({ ...o, step: 'generate' }); return render(); }
    const pf = !!o.meta?.photo_first;
    main.innerHTML = `${pf ? stepsBar(3, 3) : stepsBar(4)}<div class="stack"><span class="eyebrow">Último passo antes de criar</span><h1>Onde eu guardo seus posts?</h1><p class="lead">${loginLead()} Logo depois eu crio ${pf && o.product?.name ? 'o carrossel e o reels de ' + esc(o.product.name) : 'seu primeiro conteúdo'}.</p></div>
      <form class="card" id="f">${googleBtn('start')}${emailFields(o.email || '')}
        <ul class="perm"><li>${ic('check')}<b>Sem senha e sem cartão.</b> Você entra em um toque.</li><li>${ic('check')}<b>Seus posts ficam salvos</b> para baixar ou publicar quando quiser.</li><li>${ic('check')}<b>Nada vai para o ar sem você.</b> A Íris só cria; quem posta é você.</li></ul>
        <button class="btn btn-ghost btn-block" type="button" id="back">${ic('back')}Voltar</button></form>`;
    $('#f').onsubmit = async e => { e.preventDefault(); const email = $('#email').value.trim(); const btn = $('#f button[type=submit]'); busy(btn, true);
      try { const d = await api('/auth/request', { method: 'POST', body: { email } }); ONB.set({ ...o, email }); codeForm(email, d.dev_code, async () => { await loadMe(); ONB.set({ ...ONB.get(), step: 'generate' }); render(); }); } catch (err) { $('#h').textContent = err.message; } finally { busy(btn, false); } };
    $('#back').onclick = () => { ONB.set({ ...o, step: pf ? 'details' : 'product' }); render(); };
  }
  function codeForm(email, devCode, onDone) {
    main.innerHTML = `<div class="stack center"><img class="mark" src="/assets/iris-mark.png" alt=""><h1>Digite o código</h1><p class="lead">${ic('mail', 'sm')} Enviado para <b>${esc(email)}</b>. Vale por 10 minutos.</p></div>
      <form class="card" id="f"><input class="input code" id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" value="${esc(devCode || '')}"><p class="hint" id="h"></p>
      ${devCode ? '<p class="micro center">Ambiente de desenvolvimento: o código veio preenchido porque o envio de e-mail não está configurado.</p>' : ''}
      <button class="btn btn-primary btn-block" type="submit"><span class="spin"></span>Entrar</button><button class="btn btn-ghost btn-block" type="button" id="again">Pedir outro código</button></form>`;
    $('#code').focus();
    $('#f').onsubmit = async e => { e.preventDefault(); const btn = $('#f button[type=submit]'); busy(btn, true); try { await api('/auth/verify', { method: 'POST', body: { email, code: $('#code').value.trim() } }); await onDone(); } catch (err) { $('#h').textContent = err.message; busy(btn, false); } };
    $('#again').onclick = async () => { try { const d = await api('/auth/request', { method: 'POST', body: { email } }); toast('Novo código enviado.'); if (d.dev_code) $('#code').value = d.dev_code; } catch (err) { $('#h').textContent = err.message; } };
  }
  async function stepGenerate(o) {
    main.innerHTML = `<div id="run"></div>`;
    const photo = o.file_data || (o.product?.image_url ? '/api/img?u=' + encodeURIComponent(o.product.image_url) : null);
    const R = runPanel($('#run'), { title: `Criando para ${o.brand?.name || 'sua loja'}`, photo, tasks: [
      { id: 'brand', label: 'Guardar sua marca' }, { id: 'photo', label: 'Preparar a foto da peça' }, { id: 'copy', label: 'Escrever o hook, os slides e a legenda' },
      { id: 'art', label: 'Aplicar as cores e a fonte da marca' }, { id: 'reel', label: 'Gerar o vídeo do reels' }] });
    try {
      R.run('brand'); await api('/brand', { method: 'PUT', body: o.brand }); R.done('brand', o.brand?.name || '');
      R.run('photo');
      let body = { name: o.product.name, price: o.product.price, source: o.product.source || 'site', image_url: o.product.image_url };
      if (o.file_data) { const blob = dataUrlToBlob(o.file_data); const up = await fetch('/api/upload', { method: 'POST', headers: { 'content-type': blob.type }, body: blob }).then(r => r.json()); if (!up.ok) throw new Error(up.message || 'Falha no envio da foto.'); body = { ...body, image_url: up.url, image_key: up.key, source: 'upload' }; }
      const { product } = await api('/products', { method: 'POST', body });
      R.done('photo', `${product.name}${product.price ? ' · ' + product.price : ''}`);
      R.run('copy'); R.run('reel', 'Na fila');
      const { contents } = await api('/contents', { method: 'POST', body: { product_id: product.id, formats: ['carousel', 'reel'], offer: o.offer || '', gift: true } });
      const car = contents.find(c => c.format === 'carousel'), reel = contents.find(c => c.format === 'reel');
      R.done('copy', car ? `Hook: “${car.spec.copy?.slides?.[0]?.title || ''}” · ${car.spec.copy?.slides?.length || 0} slides` : 'Pronto');
      R.run('art');
      if (car) { try { R.reveal(await svgFor(car, 'carousel', 0)); } catch { } }
      R.done('art', 'Paleta, fonte e hook aplicados');
      if (reel) { if (reel.spec?.mock) R.done('reel', 'Prévia animada pronta (vídeo real quando a chave do Higgsfield for ligada)'); else if (reel.status === 'failed') R.fail('reel', 'O vídeo falhou; a capa e a legenda estão prontas'); else R.done('reel', 'Enviado para o gerador. Fica pronto em 1 a 3 minutos'); }
      R.finish(); R.note('Pronto. Essa é a capa do seu carrossel.');
      track('cadastro');
      ONB.set({ step: 'result', ids: contents.map(c => c.id) }); ss.del('iris-loja');
      await loadMe();
      $('#run').insertAdjacentHTML('beforeend', '<button class="btn btn-primary btn-block" id="see" style="margin-top:4px">Ver meu conteúdo</button>');
      let gone = false; const go = () => { if (gone) return; gone = true; render(); };
      $('#see').onclick = go; setTimeout(go, 6000);
    } catch (e) {
      if (e.code === 'no_credits') { ONB.set({ ...o, step: 'result', ids: [] }); toast(e.message); location.hash = '#/plano'; return; }
      ['brand', 'photo', 'copy', 'art', 'reel'].forEach(id => { const r = $(`#run [data-t="${id}"]`); if (r?.dataset.state === 'running') R.fail(id, e.message); });
      $('#run').insertAdjacentHTML('beforeend', '<button class="btn btn-primary btn-block" id="r" style="margin-top:12px">Tentar de novo</button>'); $('#r').onclick = render;
    }
  }

  async function stepResult(o) {
    const ids = o.ids || [];
    if (!ids.length) { ONB.set({}); location.hash = '#/home'; return; }
    const bc = me.brand?.colors || {};
    main.innerHTML = `<div class="stack center"><img class="mark" src="/assets/iris-mark.png" alt=""><span class="brand-chip"><span class="bs-sw">${['primary', 'secondary', 'accent'].map(k => `<i style="background:${esc(bc[k] || '#ccc')}"></i>`).join('')}</span>${esc(me.brand?.name || 'Sua loja')}${ic('check', 'sm ok')}</span><h1>Olha o que a Íris criou.</h1><p class="lead">Seu carrossel e seu reels, com a cara da sua marca. Passe os slides, ajuste o texto se quiser.</p></div><div class="stack" id="out"></div>
      <div class="cta-bar"><button class="btn btn-primary btn-block btn-lg" id="next" aria-busy="true"><span class="spin"></span>Finalizando seu reels…</button><p class="fine">Depois você baixa as imagens, copia a legenda ou publica direto.</p></div>`;
    for (const id of ids) { const box = document.createElement('div'); $('#out').appendChild(box); contentBlock(box, id, false, true); }
    // o Instagram só entra quando os criativos estão prontos
    const ig = igBeta() || (me.instagram?.account && !me.instagram.account.expired), btn = $('#next');
    const ready = () => { busy(btn, false); btn.lastChild.textContent = ig ? 'Quero postar no meu Instagram' : 'Quero baixar e postar'; btn.insertAdjacentHTML('beforeend', ic('arrow')); };
    const check = async () => { if (!document.body.contains(btn)) return;
      const cs = await Promise.all(ids.map(id => api('/contents/' + id).then(d => d.content).catch(() => null)));
      if (cs.some(c => c && ['queued', 'in_progress'].includes(c.status))) return setTimeout(check, 6000);
      ready(); };
    check();
    btn.onclick = () => { ONB.set({ ...o, step: ig ? 'instagram' : 'offer' }); render(); scrollTo(0, 0); };
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
    const seg = (k, v, l) => `<button class="chip" type="button" data-${k}="${v}" aria-pressed="${PAY[k] === v}">${v === 'pix' ? logo('pix', 'c-pix') : v === 'card' ? ic('card') : ''}${l}</button>`;
    if (!pixOn && !cardOn) return `<p class="pay-note">${ic('info', 'sm')} O pagamento está sendo liberado. Escolha o plano e a Íris te avisa assim que abrir, sem cobrar nada agora.</p>`;
    return `<div class="stack" style="gap:8px;align-items:center">${pixOn && cardOn ? `<div class="chips" style="justify-content:center">${seg('method', 'pix', 'Pix')}${seg('method', 'card', 'Cartão')}</div>` : ''}
      ${PAY.method === 'pix' && anual ? `<div class="chips" style="justify-content:center">${seg('period', 'mensal', 'Mensal')}${seg('period', 'anual', 'Anual <small>2 meses grátis</small>')}</div>` : ''}
      <p class="pay-note">${PAY.method === 'pix' ? logo('pix', 'c-pix') : ic('card', 'sm')} ${PAY.method === 'pix' ? (PAY.period === 'anual' ? 'Um Pix por ano. Sem renovação automática.' : 'Um Pix por mês. A Íris avisa antes de vencer, sem cobrança automática.') : 'Cartão renova sozinho todo mês. Cancele quando quiser.'}</p></div>`;
  }
  const planCta = () => { const { pixOn, cardOn } = payState(); return pixOn || cardOn ? 'Assinar' : 'Quero o'; };
  // cartão de plano único para oferta e configurações
  function planCard(k, p, { featured = false, current = false, renewPix = false } = {}) {
    return `<div class="plan ${featured ? 'feat' : ''} ${current ? 'on' : ''}">
      <div class="plan-h"><h3>${esc(p.name)}</h3>${featured ? '<span class="tag wait">Mais escolhido</span>' : current ? '<span class="tag ok">seu plano</span>' : ''}</div>
      <div class="price">${p.price ? priceLabel(p) : 'R$ 0<small>/mês</small>'}</div>
      <ul>${p.perks.map(x => `<li>${ic('check')}${esc(x)}</li>`).join('')}</ul>
      ${current || k === 'free' ? '' : `<button class="btn ${featured ? 'btn-primary' : 'btn-ghost'} btn-block" data-plan="${k}"><span class="spin"></span>${planCta()} ${esc(p.name)}${ic('arrow')}</button>`}
      ${current && renewPix ? `<button class="btn btn-ghost btn-block" data-plan="${k}"><span class="spin"></span>${logo('pix', 'c-pix')}Renovar com Pix</button>` : ''}</div>`;
  }
  const priceLabel = p => PAY.method === 'pix' && PAY.period === 'anual' ? `R$ ${p.price * 10}<small>/ano</small>` : `R$ ${p.price}<small>/mês</small>`;
  function bindPay(rerender, back) {
    $$('[data-method]').forEach(b => b.onclick = () => { PAY.method = b.dataset.method; rerender(); });
    $$('[data-period]').forEach(b => b.onclick = () => { PAY.period = b.dataset.period; rerender(); });
    const { pixOn, cardOn } = payState();
    $$('[data-plan]').forEach(b => b.onclick = async () => { busy(b, true);
      // pagamento ainda desligado: guarda o interesse (lead + evento) e deixa a pessoa seguir no grátis
      if (!pixOn && !cardOn) { try { await api('/lead', { method: 'POST', body: { etapa: 'plano', plano: b.dataset.plan, contato: me.user?.email || '', user_id: me.user?.id || '', lp: ss.get('iris-lp') || 'direto', origem: location.href } }); } catch { } track('plano', { plano: b.dataset.plan }); toast(`Anotado: plano ${me.plans[b.dataset.plan]?.name || ''}. A Íris te avisa quando o pagamento abrir. Até lá, siga no grátis.`, 6000); if (back === 'start') ONB.set({}); location.hash = '#/home'; return; }
      try { const d = await api('/billing/checkout', { method: 'POST', body: { plan: b.dataset.plan, method: PAY.method, period: PAY.period, back } }); if (back === 'start') ONB.set({}); location.href = d.url; } catch (e) { toast(e.message, 5000); busy(b, false); } });
  }

  async function stepOffer(o) {
    const ids = o.ids || [];
    const plans = me.plans;
    main.innerHTML = `<div class="stack center"><img class="mark" src="/assets/iris-mark.png" alt=""><h1>Conteúdo assim toda semana.</h1><p class="lead">Escolha um plano para baixar o que você acabou de ver e continuar criando sem pensar em post.</p></div>
      ${payBar()}
      <div class="plans">${['pro', 'basico', 'loja'].map(k => planCard(k, plans[k], { featured: k === 'pro' })).join('')}</div>
      <p class="pay-note">${ic('shield', 'sm')} Sem fidelidade. Pagamento seguro.</p>
      <button class="btn btn-ghost btn-block" id="free">Continuar no plano grátis</button><p class="fine center" style="margin-top:-8px">No grátis: 2 posts por mês, sem reels. Dá para mudar quando quiser.</p>
      <p class="micro center"><a href="#" id="back">${ic('back', 'sm')} Voltar para o conteúdo</a></p>`;
    bindPay(() => stepOffer(o), 'start');
    $('#free').onclick = e => { e.preventDefault(); ONB.set({}); location.hash = '#/home'; };
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
    return `${acc?.expired ? '<p class="hint">A conexão expirou. Conecte de novo.</p>' : ''}<p class="lead">Precisa ser uma conta comercial ou de criador. Você entra pelo próprio Instagram e a Íris só ganha permissão para ver o perfil e publicar.</p><a class="btn btn-ig btn-block" href="/api/instagram/connect?back=${back}">${logo('instagram')}Conectar Instagram</a>`;
  }
  // Logo depois dos criativos prontos: conectar para publicar o que ela acabou de ver. Permissão explicada ao lado do pedido.
  function stepInstagram(o, r) {
    const done = me.instagram?.account && !me.instagram.account.expired;
    if (!done && !igBeta()) { ONB.set({ ...o, step: 'offer' }); return render(); }
    if (done && r?.q.get('ig') === 'ok') track('instagram');
    main.innerHTML = `<div class="stack center"><img class="mark" src="/assets/iris-mark.png" alt=""><span class="eyebrow" style="justify-content:center">Seus posts estão prontos</span><h1>${done ? 'Instagram conectado.' : 'Agora é postar.'}</h1><p class="lead">${done ? 'O que você aprovar vai para o seu perfil com um toque, sem baixar nada.' : 'Conecte o Instagram da loja e publique o carrossel e o reels direto daqui, sem baixar nem copiar legenda.'}</p></div>
      <div class="card">${done ? igCard('start') : `<ul class="perm">
          <li><b>Você entra pelo próprio Instagram.</b> A Íris nunca vê sua senha.</li>
          <li><b>Nada vai para o ar sem você aprovar.</b> A Íris só publica o post que você mandar.</li>
          <li><b>Lê seu perfil e o alcance dos posts</b> para mostrar o que está vendendo. Não lê o direct.</li></ul>
        <p class="fine">Funciona com conta comercial ou de criador. Dá para desconectar quando quiser em Configurações.</p>
        <a class="btn btn-ig btn-block" href="/api/instagram/connect?back=start">${logo('instagram')}Conectar Instagram</a>`}</div>
      <button class="btn ${done ? 'btn-primary' : 'btn-ghost'} btn-block" id="go">${done ? 'Continuar' : 'Agora não, vou baixar'}${done ? ic('arrow') : ''}</button>`;
    $('#go').onclick = () => { ONB.set({ ...o, step: 'offer' }); render(); scrollTo(0, 0); };
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
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
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
      <div class="dash-head"><div class="who">${b.logo_url ? `<img src="${imgSrc(b.logo_url)}" alt="" onerror="this.remove()">` : ''}<div><span class="eyebrow">${greeting()} · Visão geral</span><h1>${esc(b.name || 'Sua loja')}</h1></div></div>
        <a class="btn btn-primary hide-m" href="${nextHref}">${ic('sparkles')}Criar o próximo post</a></div>
      ${me.billing?.renew_soon ? `<div class="card tight row between"><p style="margin:0">Seu plano pago com Pix vence em ${Math.max(0, Math.ceil((new Date(me.billing.until) - Date.now()) / 86400e3))} dia(s).</p><a class="btn btn-primary btn-sm" href="#/plano">Renovar com Pix</a></div>` : ''}
      ${chatCard(next, prod, soon)}
      <div class="kpis">
        <div class="kpi"><div class="ic ok">${ic('check')}</div><span>Prontos para postar</span><b>${ready.length}</b><small>${generating.length ? generating.length + ' gerando agora' : 'aprovados e para revisar'}</small></div>
        <div class="kpi"><div class="ic pub">${ic('send')}</div><span>Publicados no mês</span><b>${published.length}</b><small>${me.instagram?.account ? 'direto no Instagram' : 'conecte o Instagram para publicar'}</small></div>
        <div class="kpi"><div class="ic img">${ic('image')}</div><span>Posts restantes</span><b>${u.left.posts}</b><small>de ${u.limit.posts} no mês</small></div>
        <div class="kpi"><div class="ic vid">${ic('reel')}</div><span>Reels restantes</span><b>${u.limit.reels ? u.left.reels : '–'}</b><small>${u.limit.reels ? 'de ' + u.limit.reels + ' no mês' : 'não incluso no plano grátis'}</small></div>
      </div>
      <div class="dash-grid">
        <div class="stack">
          <div class="card c-funil"><div class="sec-h"><h3>Funil da semana<small>Postagens desde segunda, por etapa. Reels atraem, carrossel convence, feed vende.</small></h3><button class="btn btn-ghost btn-sm" type="button" id="ins-r" hidden>${ic('refresh')}Atualizar</button></div>
            <div class="fn" id="fn">${['reel', 'carousel', 'feed'].map(f => fnRow(f, { posts: done(f) }, goal[f], null)).join('')}</div>
            <div id="fn-foot" class="fn-foot"></div>
            ${next && prod ? `<div class="suggest"><span class="eyebrow">Próximo post sugerido</span><p><b>${FORMAT[next]} de ${esc(prod.name)}</b> ${why[next]}${soon && next !== 'reel' ? `, já puxando o gancho de ${esc(soon.n)}` : ''}.</p><a class="btn btn-primary btn-sm" href="${nextHref}">${ic('sparkles')}Criar agora</a></div>`
              : !prod ? `<div class="suggest"><p>Envie a foto de um produto para a Íris sugerir os próximos posts.</p><a class="btn btn-primary btn-sm" href="#/create">${ic('camera')}Enviar foto</a></div>`
              : `<div class="suggest"><p>Você usou os créditos do mês. Mude de plano para manter o ritmo.</p><a class="btn btn-primary btn-sm" href="#/plano">${ic('zap')}Ver planos</a></div>`}
          </div>
          <div class="card c-prontos"><div class="sec-h"><h3>Prontos para postar<small>Revise, aprove e publique.</small></h3><a class="micro" href="#/conteudos">Ver todos${ic('arrow', 'sm')}</a></div>
            ${ready.length ? `<div class="posts ready">${ready.slice(0, 8).map(postCard).join('')}</div>` : `<div class="empty-state">${ic(generating.length ? 'clock' : 'sparkles')}<b>${generating.length ? 'Seu conteúdo está sendo gerado' : 'Nada pronto ainda'}</b><span>${generating.length ? 'Volte em alguns minutos.' : 'Crie o próximo post sugerido acima e ele aparece aqui.'}</span></div>`}
          </div>
          <div class="card c-ritmo"><h3>Ritmo<small>Conteúdos criados por semana.</small></h3>
            <div class="weeks">${weeks.map(w => `<div class="${w.now ? 'now' : ''}"><i style="height:${Math.max(4, Math.round(w.n / maxW * 52))}px" title="${w.n} conteúdos"></i><span>${w.label}</span></div>`).join('')}</div></div>
        </div>
        <div class="stack">
          <div class="card c-datas"><h3>Datas que vendem<small>O que vem aí no varejo.</small></h3>
            ${dates.length ? `<div class="dates">${dates.slice(0, 4).map(d => `<div class="d"><div class="when">${d.days === 0 ? 'hoje' : d.days}<small>${d.days === 0 ? '' : d.days === 1 ? 'dia' : 'dias'}</small></div><div><b>${esc(d.n)}</b> · ${d.d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}<p>${esc(d.t)}</p></div></div>`).join('')}</div>` : '<p class="lead">Nenhuma data forte nas próximas semanas. Bom momento para novidades.</p>'}</div>
          <div class="card c-loja"><div class="sec-h"><h3>Sua loja</h3><a class="micro" href="#/conta">${ic('pencil', 'sm')}Editar</a></div>
            <dl class="ctx">
              <div><dt>Cores</dt><dd class="sw">${['primary', 'secondary', 'accent'].map(k => `<i style="background:${esc(b.colors?.[k] || '#ccc')}"></i>`).join('')}</dd></div>
              ${b.icp ? `<div><dt>Quem compra</dt><dd>${esc(b.icp)}</dd></div>` : ''}
              ${b.tone ? `<div><dt>Tom de voz</dt><dd>${esc(b.tone)}</dd></div>` : ''}
              <div><dt>Produtos</dt><dd>${(me.products || []).length} cadastrados${b.site_url ? ` · <a href="${esc(b.site_url)}" target="_blank" rel="noopener">site</a>` : ''}</dd></div>
              <div><dt>Instagram</dt><dd class="row" style="gap:6px">${logo('instagram', 'sm c-ig')}${me.instagram?.account ? '@' + esc(me.instagram.account.username) + ' conectado' : `<a href="#/conta">Conectar para publicar</a>`}</dd></div>
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
  // ícones de linha (mesmo estilo dos demais) para etapas e métricas do funil
  const FNI = {
    reel: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M3 8.5h18M8 3l3 5.5M13.5 3l3 5.5"/><path d="m10.5 12 4 2.5-4 2.5z"/>',
    carousel: '<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M3 7v10M21 7v10"/>',
    feed: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="9" cy="9" r="1.8"/><path d="m4 17 5-5 4 4 2.5-2.5L20 18"/>',
    reach: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    views: '<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5 3.5-5 3.5z"/>',
    saved: '<path d="M6 3.5h12v17l-6-4.6-6 4.6z"/>',
    shares: '<path d="M21 3 10 14M21 3l-6.8 18-3.2-7-7-3.2z"/>',
    interactions: '<path d="M12 20s-7-4.4-9.2-8.6C1.1 8.1 3 4.5 6.6 4.5c2 0 3.3 1.1 4.1 2.3h.6c.8-1.2 2.1-2.3 4.1-2.3 3.6 0 5.5 3.6 3.8 6.9C19 15.6 12 20 12 20z"/>',
    profile_visits: '<circle cx="12" cy="8" r="4"/><path d="M4 20.5c1.4-3.6 4.4-5.5 8-5.5s6.6 1.9 8 5.5"/>',
  };
  const fnIcon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${FNI[k]}</svg>`;
  function fnRow(f, st, goal, metrics) {
    const posts = st?.posts || 0, pct = Math.min(100, Math.round(posts / goal * 100));
    return `<div class="fn-row st-${STAGE[f][0]}"><div class="fn-name"><span class="fn-ic">${fnIcon(f)}</span><div><b>${FORMAT[f]}</b><small>${STAGE[f][1]} · ${STAGE[f][2]}</small></div></div>
      <div class="fn-posts"><div class="bar"><i style="width:${pct}%"></i></div><small>${posts} de ${goal} na semana</small></div>
      ${FN_METRICS[f].map(([k, l]) => `<div class="fn-m"><b>${metrics ? nf(metrics[k]) : '–'}</b><small>${fnIcon(k)}${l}</small></div>`).join('')}</div>`;
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
        <div class="chat-box"><label for="chat-t" class="pfx">${ic('sparkles')}Íris, cria</label><textarea id="chat-t" rows="2" placeholder="um carrossel do vestido novo para a Black Friday, 3x sem juros"></textarea></div>
        <div id="chat-att" class="chat-att" hidden></div>
        <div id="chat-ig" class="chat-ig" hidden></div>
        <div class="row between">
          <div class="row">
            <label class="btn btn-ghost btn-sm"><input type="file" id="chat-file" accept="image/*" hidden>${ic('camera')}<span>Foto<span class="hide-m"> do celular</span></span></label>
            <button class="btn btn-ghost btn-sm" type="button" id="chat-igb">${logo('instagram', 'c-ig')}<span>${ig.account && !ig.account.expired ? '<span class="hide-m">Do meu </span>Instagram' : '<span class="hide-m">Conectar </span>Instagram'}</span></button>
          </div>
          <button class="btn btn-primary btn-sm" type="submit" id="chat-go"><span class="spin"></span>Criar${ic('send')}</button>
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
      log.insertAdjacentHTML('beforeend', '<div class="msg iris" id="chat-run"></div>');
      const R = runPanel($('#chat-run'), { title: 'Criando', compact: true, tasks: [{ id: 'intent', label: 'Entender o pedido' }, { id: 'photo', label: 'Preparar a foto' }, { id: 'make', label: 'Escrever e montar a arte' }] });
      R.run('intent'); setTimeout(() => { R.done('intent'); R.run('photo'); }, 700); setTimeout(() => { R.done('photo'); R.run('make'); }, 1500);
      try {
        const r = await api('/chat', { method: 'POST', body: { text, default_format: next, ...(CHAT.att?.upload ? { upload: CHAT.att.upload } : {}), ...(CHAT.att?.ig_media_id ? { ig_media_id: CHAT.att.ig_media_id } : {}) } });
        $('#chat-run')?.remove();
        CHAT.log.push({ text: r.reply, ids: r.contents.map(c => ({ id: c.id, format: c.format })) });
        log.insertAdjacentHTML('beforeend', chatMsg(CHAT.log.at(-1))); hydrateArts(r.contents);
        $('#chat-t').value = ''; setAtt(null); await loadMe(); sideInfo();
      } catch (err) { $('#chat-run')?.remove(); CHAT.log.push({ text: err.message }); log.insertAdjacentHTML('beforeend', chatMsg(CHAT.log.at(-1))); }
      finally { saveChat(); busy(btn, false); log.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } };
  }
  /* ---------- conteúdos: fluxo de postagens ---------- */
  async function viewContents(r) {
    const { contents } = await api('/contents');
    const f = r.q.get('f') || 'all';
    const list = contents.filter(c => f === 'all' || c.format === f);
    const cols = [['Gerando', c => ['queued', 'in_progress'].includes(c.status), 'gerando', 'clock', 'Nada gerando agora.'], ['Para revisar', c => c.status === 'completed', 'revisar', 'eye', 'Tudo revisado.'], ['Aprovados', c => c.status === 'approved', 'aprovados', 'check', 'Aprove um conteúdo para ele ficar pronto para postar.'], ['Publicados', c => c.status === 'published', 'publicados', 'send', 'O que você publicar aparece aqui.'], ['Com erro', c => c.status === 'failed', 'erro', 'alert', '']];
    main.innerHTML = `<div class="dash-head"><div><span class="eyebrow">Fluxo de postagens</span><h1>Conteúdos</h1></div><a class="btn btn-primary" href="#/create">${ic('plus')}Criar</a></div>
      <nav class="subnav">${[['all', 'Todos'], ['reel', 'Reels · topo'], ['carousel', 'Carrossel · meio'], ['feed', 'Feed · fundo']].map(([k, l]) => `<a href="#/conteudos?f=${k}" aria-current="${f === k ? 'page' : 'false'}">${l}</a>`).join('')}</nav>
      ${list.length ? '' : `<div class="empty-state">${ic('sparkles')}<b>Nenhum conteúdo ainda</b><span>Envie a foto de uma peça e a Íris cria o post, o carrossel e o reels.</span><a class="btn btn-primary btn-sm" href="#/create">${ic('camera')}Criar o primeiro</a></div>`}
      <div class="board">${cols.filter(([n, fn]) => n !== 'Com erro' || list.some(fn)).map(([n, fn, cls, icn, empty]) => { const items = list.filter(fn); return `<section class="col ${cls}"><h3><span class="st"><i></i>${n}</span><span>${items.length}</span></h3>${items.length ? items.map(postCard).join('') : `<p class="empty">${ic(icn)}${empty}</p>`}</section>`; }).join('')}</div>`;
    hydrateArts(list);
  }
  const thumb = c => c.spec.product?.image_url ? (c.spec.product.image_url.startsWith(location.origin) ? c.spec.product.image_url : '/api/img?u=' + encodeURIComponent(c.spec.product.image_url)) : '/assets/iris-mark.png';
  const statusTag = c => ({ queued: '<span class="tag wait">gerando</span>', in_progress: '<span class="tag wait">gerando</span>', completed: '<span class="tag">pronto</span>', approved: '<span class="tag ok">aprovado</span>', published: '<span class="tag ok">publicado</span>', failed: '<span class="tag err">falhou</span>' }[c.status] || '');

  /* ---------- criar ---------- */
  async function viewCreate(r) {
    const prods = me.products || [];
    const pre = r.q.get('product'), preF = r.q.get('format');
    const FMT = [['reel', 'Reels', 'topo', 'Atrai gente nova. Vídeo curto, produto sem texto na tela.'], ['carousel', 'Carrossel', 'meio', 'Convence. Detalhes, uso e combinações em 5 slides.'], ['feed', 'Post no feed', 'fundo', 'Vende. Preço e condição para fechar.']];
    main.innerHTML = `<div class="stack"><span class="eyebrow">Criar</span><h1>O que vamos postar?</h1><p class="lead">Escolha a peça, o formato e, se quiser, a oferta. A Íris escreve e monta a arte com a sua marca.</p></div>
      <form class="card" id="f">
        <div class="field"><span class="lbl">Produto</span><div class="grid" id="grid"><label class="pick add"><input type="file" id="file" accept="image/*" hidden>${ic('camera')}Foto do celular<small>peça nova</small></label>${prods.map(p => `<button class="pick" type="button" data-id="${p.id}" aria-pressed="${p.id === pre ? 'true' : 'false'}"><img src="${p.image_url.startsWith(location.origin) ? p.image_url : '/api/img?u=' + encodeURIComponent(p.image_url)}" alt="${esc(p.name)}" loading="lazy"></button>`).join('')}</div></div>
        <div id="newp" hidden class="stack"><div class="field"><label for="p-name">Nome do produto</label><input class="input" id="p-name"></div><div class="field"><label for="p-price">Preço</label><input class="input" id="p-price" placeholder="R$ 189"></div></div>
        <div class="field"><span class="lbl">Formatos</span><div class="fmts">
          ${FMT.map(([k, n, st, help]) => `<button class="fmt st-${st}" type="button" data-f="${k}" aria-pressed="${preF ? preF === k : k === 'feed'}"><span class="fi">${ic(k === 'feed' ? 'image' : k)}</span><span><b>${n} ${funnelTag(k)}</b><small>${help}</small></span><span class="ck">${ic('check')}</span></button>`).join('')}</div>
          <p class="credits"><span>${ic('image')}<b>${me.usage.left.posts}</b> posts</span><span>${ic('reel')}<b>${me.usage.limit.reels ? me.usage.left.reels : 0}</b> reels</span><span>restantes neste mês${me.user.plan === 'free' ? ' · <a href="#/plano">ver planos</a>' : ''}</span></p></div>
        <div class="field"><label for="offer">Condição ou oferta (opcional, não entra no reels)</label><input class="input" id="offer" placeholder="3x sem juros, frete grátis, só até domingo" value="${esc(r.q.get('offer') || '')}"></div>
        <p class="hint" id="h"></p>
        <button class="btn btn-primary btn-block btn-lg" type="submit"><span class="spin"></span>${ic('sparkles')}Gerar</button></form>`;
    let pid = pre || null, file = null;
    $$('.pick[data-id]').forEach(b => b.onclick = () => { $$('.pick').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); pid = b.dataset.id; file = null; $('#newp').hidden = true; });
    $('#file').onchange = async e => { const f = e.target.files[0]; if (!f) return; file = dataUrlToBlob(await readPhoto(f)); pid = null; $$('.pick').forEach(x => x.setAttribute('aria-pressed', 'false')); const lab = $('.pick.add'); lab.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="">`; lab.setAttribute('aria-pressed', 'true'); $('#newp').hidden = false; $('#p-name').focus(); };
    $$('.fmt[data-f]').forEach(c => c.onclick = () => c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'));
    $('#f').onsubmit = async e => { e.preventDefault(); const formats = $$('.fmt[aria-pressed="true"]').map(c => c.dataset.f); const btn = $('#f button[type=submit]');
      if (!formats.length) { $('#h').textContent = 'Escolha pelo menos um formato.'; return; }
      if (!pid && !file) { $('#h').textContent = 'Escolha um produto ou envie uma foto.'; return; }
      busy(btn, true);
      try {
        if (file) { const name = $('#p-name').value.trim(); if (!name) throw new Error('Dê um nome ao produto.'); const up = await fetch('/api/upload', { method: 'POST', headers: { 'content-type': file.type }, body: file }).then(r => r.json()); if (!up.ok) throw new Error(up.message || 'Falha no envio.'); const { product } = await api('/products', { method: 'POST', body: { name, price: $('#p-price').value.trim(), image_url: up.url, image_key: up.key, source: 'upload' } }); pid = product.id; }
        const prodImg = file ? URL.createObjectURL(file) : (() => { const p = (me.products || []).find(x => x.id === pid); return p ? imgSrc(p.image_url) : null; })();
        const NAMES = { reel: 'reels', carousel: 'carrossel', feed: 'post no feed' };
        main.innerHTML = '<div id="run"></div>';
        const R = runPanel($('#run'), { title: 'Transformando sua foto em post', photo: prodImg, tasks: [{ id: 'copy', label: `Escrever ${formats.map(f => NAMES[f]).join(', ')}` }, { id: 'art', label: 'Aplicar as cores e a fonte da marca' }, ...(formats.includes('reel') ? [{ id: 'reel', label: 'Gerar o vídeo do reels' }] : [])] });
        R.run('copy'); if (formats.includes('reel')) R.run('reel', 'Na fila');
        const { contents } = await api('/contents', { method: 'POST', body: { product_id: pid, formats, offer: $('#offer').value.trim() } });
        const first = contents.find(c => c.format !== 'reel') || contents[0];
        const cp = first.spec.copy || {}; R.done('copy', `Hook: “${cp.hook || cp.slides?.[0]?.title || ''}”`);
        R.run('art'); try { R.reveal(await svgFor(first, first.format === 'reel' ? 'reel' : first.format, 0)); } catch { } R.done('art', 'Paleta, fonte e hook aplicados');
        const rl = contents.find(c => c.format === 'reel'); if (rl) R.done('reel', rl.spec?.mock ? 'Prévia animada pronta' : 'Enviado ao gerador · 1 a 3 minutos');
        R.finish(); await loadMe(); await pause(1400);
        location.hash = '#/content/' + first.id; if (contents.length > 1) toast(`${contents.length} conteúdos criados. Veja todos em Conteúdos.`);
      } catch (err) { $('#h').textContent = err.message; if (err.code === 'no_credits') setTimeout(() => location.hash = '#/plano', 1200); } finally { busy(btn, false); } };
  }

  /* ---------- conteúdo ---------- */
  async function viewContent(r) {
    main.innerHTML = `<a class="back" href="#/conteudos">${ic('back')}Conteúdos</a><div id="box"></div>`;
    contentBlock($('#box'), r.id, true);
  }
  async function contentBlock(box, id, full, showcase = false) {
    let { content: c } = await api('/contents/' + id);
    const draw = async () => {
      const copy = c.spec.copy || {};
      box.innerHTML = `<div class="card ${full ? 'detail' : ''}"><div class="row between"><h2>${esc(FORMAT[c.format])}</h2>${statusTag(c)}</div><p class="micro">${esc(c.spec.product?.name || '')}${c.spec.product?.price ? ' · ' + esc(c.spec.product.price) : ''}</p>
        <div class="preview" id="pv"><p class="micro">Montando a arte…</p></div>
        <div class="stack" id="edit"></div>
        <div class="row acts" id="actions"></div></div>`;
      const pv = $('#pv', box), ed = $('#edit', box), ac = $('#actions', box);
      try {
        if (c.format === 'reel') await drawReel(pv, c); else await drawSlides(pv, c);
      } catch (e) { console.error(e); pv.innerHTML = `<p class="hint">Não consegui montar a arte: ${esc(e.message)}</p>`; }
      // edição
      const fields = c.format === 'feed' ? [['hook', 'Hook (título da arte)'], ['body', 'Body (subtítulo da arte)'], ['caption', 'Legenda']] : c.format === 'reel' ? [['hook', 'Gancho (1ª linha da legenda, fora do vídeo)'], ['caption', 'Legenda']] : [['caption', 'Legenda']];
      ed.innerHTML = `<details><summary class="btn btn-ghost btn-sm">${ic('pencil')}Editar texto</summary><div class="stack" style="padding-top:12px">${fields.map(([k, l]) => `<div class="field"><label for="e-${k}">${l}</label><textarea class="input" id="e-${k}">${esc(copy[k] || (k === 'hook' ? copy.headline || copy.title : '') || '')}</textarea></div>`).join('')}
        ${c.format === 'carousel' ? (copy.slides || []).map((s, i) => `<div class="field"><label>Slide ${i + 1}: hook e body</label><input class="input" id="s-t-${i}" value="${esc(s.title)}"><input class="input" id="s-b-${i}" value="${esc(s.body)}"></div>`).join('') : ''}
        <button class="btn btn-primary btn-sm" id="save">${ic('check')}Salvar e montar de novo</button></div></details>`;
      $('#save', box).onclick = async () => { const nc = {}; fields.forEach(([k]) => nc[k] = $('#e-' + k, box).value); if (c.format === 'carousel') nc.slides = (copy.slides || []).map((s, i) => ({ title: $('#s-t-' + i, box).value, body: $('#s-b-' + i, box).value }));
        c = (await api('/contents/' + c.id, { method: 'PATCH', body: { copy: nc } })).content; draw(); toast('Texto salvo.'); };
      // ações
      const approved = c.status === 'approved', published = c.status === 'published', ready = c.status === 'completed' || approved || published;
      if (showcase) { ac.innerHTML = ''; if (c.format === 'reel' && ['queued', 'in_progress'].includes(c.status)) setTimeout(async () => { try { c = (await api('/contents/' + c.id)).content; } catch { } if (document.body.contains(box)) draw(); }, 6000); return; }
      const ig = me.instagram || {}, igOn = ig.account && !ig.account.expired, canPub = ready && !published && (c.format !== 'reel' || c.output_url || c.output_key);
      ac.innerHTML = `${published ? `${c.ig_permalink ? `<a class="btn btn-primary" href="${esc(c.ig_permalink)}" target="_blank" rel="noopener">${logo('instagram')}Ver no Instagram</a>` : '<span class="micro">Publicado no Instagram.</span>'}` : ''}
        ${canPub && igOn ? `<button class="btn btn-ig" id="pub"><span class="spin"></span>${logo('instagram')}Publicar no Instagram</button>` : ''}
        ${canPub && !igOn && ig.enabled ? `<a class="btn btn-ghost" href="/api/instagram/connect">${logo('instagram', 'c-ig')}Conectar Instagram para publicar</a>` : ''}
        ${ready && !published ? `<button class="btn ${approved || igOn ? 'btn-ghost' : 'btn-primary'}" id="ap">${ic(approved ? 'x' : 'check')}${approved ? 'Desaprovar' : 'Aprovar'}</button>` : ''}
        ${ready ? `<button class="btn btn-ghost" id="dl">${ic('download')}Baixar ${c.format === 'reel' ? 'capa' : c.format === 'carousel' ? 'slides' : 'imagem'}</button>` : ''}
        ${c.format === 'reel' && c.output_url ? `<a class="btn btn-ghost" href="${c.output_key ? '/media/' + c.output_key + '?download' : c.output_url}" download>${ic('download')}Baixar vídeo</a>` : ''}
        ${ready ? `<button class="btn btn-ghost" id="cp">${ic('copy')}Copiar legenda</button>` : ''}
        ${full ? `<button class="btn btn-ghost btn-sm" id="del">${ic('trash')}Excluir</button>` : ''}`;
      if ($('#ap', box)) $('#ap', box).onclick = async () => { c = (await api('/contents/' + c.id, { method: 'PATCH', body: { action: approved ? 'unapprove' : 'approve' } })).content; draw(); toast(approved ? 'Voltou para rascunho.' : 'Aprovado. Pode postar.'); };
      if ($('#dl', box)) $('#dl', box).onclick = () => { trackValue(); downloadAll(box, c); };
      if ($('#pub', box)) $('#pub', box).onclick = async () => { const btn = $('#pub', box); busy(btn, true); try { await publishToIg(box, c); trackValue(); c = (await api('/contents/' + c.id)).content; draw(); } catch (e) { toast(e.message, 6000); busy(btn, false); } };
      if ($('#cp', box)) $('#cp', box).onclick = async () => { const t = (copy.caption || '') + (copy.hashtags ? '\n\n' + copy.hashtags.join(' ') : ''); trackValue(); try { await navigator.clipboard.writeText(t); toast('Legenda copiada.'); } catch { prompt('Copie a legenda:', t); } };
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
  /* ---------- mock do Instagram: o post como ele aparece no app ---------- */
  const IGI = {
    heart: '<path d="M12 20s-7-4.4-9.2-8.6C1.1 8.1 3 4.5 6.6 4.5c2 0 3.3 1.1 4.1 2.3h.6c.8-1.2 2.1-2.3 4.1-2.3 3.6 0 5.5 3.6 3.8 6.9C19 15.6 12 20 12 20z"/>',
    comment: '<path d="M20.5 12a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.1-4.2A8.5 8.5 0 1 1 20.5 12z"/>',
    send: '<path d="M21 3 10 14M21 3l-6.8 18-3.2-7-7-3.2z"/>',
    save: '<path d="M6 3.5h12v17l-6-4.6-6 4.6z"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    music: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  };
  const igIcon = (k, fill) => `<svg viewBox="0 0 24 24" aria-hidden="true" class="${fill ? 'f' : ''}">${IGI[k]}</svg>`;
  function igWho(c) {
    const b = c.spec.brand || {}, handle = (b.instagram || (b.name || 'sualoja').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9._]/g, '')).replace(/^@/, '');
    const logo = me?.brand?.logo_url;
    const av = logo ? `<img src="${imgSrc(logo)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('i'),{textContent:'${esc((b.name || 'L')[0])}'}))">` : `<i style="background:${esc(b.colors?.primary || '#1F140D')}">${esc((b.name || 'L')[0].toUpperCase())}</i>`;
    return { handle, av };
  }
  const igCaption = (c, handle) => { const cp = c.spec.copy || {}; return `<p class="igm-cap"><b>${esc(handle)}</b> ${esc(cp.caption || '')}${cp.hashtags?.length ? ` <span class="tags">${esc(cp.hashtags.join(' '))}</span>` : ''}</p>`; };
  async function drawSlides(pv, c) {
    const n = c.format === 'carousel' ? (c.spec.copy?.slides || []).length || 1 : 1;
    const svgs = []; for (let i = 0; i < n; i++) svgs.push(await svgFor(c, c.format === 'carousel' ? 'carousel' : 'feed', i));
    const { handle, av } = igWho(c);
    pv.innerHTML = `<article class="igm" aria-label="Prévia no Instagram">
      <header class="igm-top"><span class="igm-av">${av}</span><b>${esc(handle)}</b><span class="igm-more">${igIcon('more', true)}</span></header>
      <div class="igm-media"><div class="igm-track">${svgs.map(x => `<div class="igm-slide">${x}</div>`).join('')}</div>${n > 1 ? `<span class="igm-count">1/${n}</span>` : ''}</div>
      <div class="igm-acts"><span>${igIcon('heart')}${igIcon('comment')}${igIcon('send')}</span>${n > 1 ? `<span class="igm-dots">${svgs.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</span>` : '<span></span>'}<span>${igIcon('save')}</span></div>
      ${igCaption(c, handle)}<span class="igm-time">Prévia · ainda não publicado</span></article>`;
    if (n > 1) { const tr = pv.querySelector('.igm-track'), cnt = pv.querySelector('.igm-count'), dots = [...pv.querySelectorAll('.igm-dots i')];
      tr.addEventListener('scroll', () => { const i = Math.round(tr.scrollLeft / tr.clientWidth); cnt.textContent = `${i + 1}/${n}`; dots.forEach((d, j) => d.classList.toggle('on', j === i)); }, { passive: true }); }
    pv.dataset.svgs = JSON.stringify(svgs);
  }
  async function drawReel(pv, c) {
    const cover = await svgFor(c, 'reel', 0);
    const vid = c.output_key ? '/media/' + c.output_key : c.output_url;
    const status = c.status, { handle, av } = igWho(c), cp = c.spec.copy || {};
    let media, note = '';
    if (vid && ['completed', 'approved', 'published'].includes(status)) media = `<video src="${vid}" playsinline loop muted autoplay></video>`;
    else { media = `<div class="kb"><img src="${await imgData(c.spec.product.image_url).catch(() => '/assets/iris-mark.png')}" alt=""></div>`;
      note = status === 'failed' ? `<p class="hint">A geração do vídeo falhou: ${esc(c.error || 'erro no provedor')}. A capa e a legenda continuam valendo.</p>` : c.spec.mock ? '<p class="fine">Prévia animada. O vídeo real é gerado quando a chave do Higgsfield estiver configurada.</p>' : '<p class="fine">Gerando o vídeo. Costuma levar de 1 a 3 minutos e a página atualiza sozinha.</p>'; }
    pv.innerHTML = `<article class="igm reel" aria-label="Prévia do reels no Instagram">
      <div class="igm-reel">${media}<span class="igm-label">Reels</span>
        <div class="igm-side">${igIcon('heart')}${igIcon('comment')}${igIcon('send')}${igIcon('more', true)}</div>
        <div class="igm-foot"><div class="igm-who"><span class="igm-av">${av}</span><b>${esc(handle)}</b><span class="igm-follow">Seguir</span></div>
          <p>${esc(cp.hook || '')}</p><span class="igm-audio">${igIcon('music')} ${esc(handle)} · Áudio original</span></div></div></article>
      ${note}
      <div class="igm-coverrow"><div class="frame">${cover}</div><div><b>Capa no perfil</b><p class="micro">É assim que o reels aparece na grade da loja.</p><p class="micro"><b>Legenda:</b> ${esc(cp.caption || '')}</p></div></div>`;
    pv.dataset.svgs = JSON.stringify([cover]);
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
      <div class="plans">${Object.entries(plans).map(([k, p]) => planCard(k, p, { current: k === cur, featured: k === 'pro' && cur === 'free', renewPix: me.billing?.source === 'pix' })).join('')}</div>
      <p class="fine">Posts: feed ou carrossel. Reels: vídeo de até 5 s gerado a partir da foto, com capa e legenda. Limites por mês = semana × 4.</p>`;
    bindPay(viewPlan, 'plano');
  }

  /* ---------- conta ---------- */
  async function viewAccount(r) {
    const b = me.brand || { colors: {} };
    main.innerHTML = `<div class="stack"><span class="eyebrow">Configurações</span><h1>Sua marca</h1><p class="lead">${me.user.email ? esc(me.user.email) : me.user.via_instagram ? 'Conta criada pelo Instagram. Para entrar de novo, use Entrar com Instagram.' : ''}</p></div>
      <nav class="subnav"><a href="#/conta" aria-current="page">Marca e integrações</a><a href="#/plano">Plano e pagamento</a></nav>
      <form class="card" id="f">${brandForm(b, null, true)}<button class="btn btn-primary btn-block" type="submit">${ic('check')}Salvar</button></form>
      <div class="card integ" id="wa"><h3>${logo('whatsapp', 'c-wa')}WhatsApp</h3>${me.user.phone ? `<p class="lead">Conectado: ${esc(me.user.phone)}. Mande a foto de um produto com nome e preço na legenda.</p>` : me.whatsapp ? `<p class="lead">Mande a foto, receba o post. Conecte seu número em dois passos.</p><button class="btn btn-ghost" id="wa-code">Gerar código</button><div id="wa-out"></div>` : `<p class="lead">Mande a foto pelo WhatsApp e receba o post pronto. Disponível no plano Pro, em breve neste ambiente.</p>`}</div>
      <div class="card integ" id="ig"><h3>${logo('instagram', 'c-ig')}Instagram</h3>${igCard('conta')}${me.instagram?.account ? `<button class="btn btn-ghost btn-sm" id="ig-off">${ic('x')}Desconectar</button>` : ''}</div>
      ${igBeta() && me.sacolinha?.enabled ? `<div class="card" id="sac-card"><h3>Sacolinha do Instagram <span class="tag">Beta</span></h3><p class="lead">${me.sacolinha.connected ? 'Conectada. Importe os produtos da sua loja do Instagram com foto e preço.' : 'Traga fotos, nomes e preços da loja do Instagram. Você entra com o Facebook que administra a loja.'}</p>
        <div class="row" style="gap:8px;flex-wrap:wrap"><a class="btn btn-ghost btn-sm" href="/api/meta/connect?back=conta">${me.sacolinha.connected ? 'Importar de novo' : 'Conectar sacolinha'}</a>${me.sacolinha.connected ? '<button class="btn btn-ghost btn-sm" id="sac-off">Desconectar</button>' : ''}</div></div>` : ''}
      <button class="btn btn-ghost btn-block" id="out">${ic('logout')}Sair da conta</button>
      <div class="card danger" id="del-card"><h3>Excluir minha conta</h3><p class="lead">Apaga sua marca, produtos, conteúdos, fotos e as conexões com Instagram e Facebook. Não dá para desfazer.</p>
        <button class="btn btn-ghost btn-sm" id="del-acc">${ic('trash')}Excluir minha conta</button>
        <div id="del-confirm" hidden><p class="lead">Tem certeza? Digite EXCLUIR para confirmar.</p><input class="input" id="del-word" autocapitalize="characters"><button class="btn btn-ghost btn-sm" id="del-go">Excluir para sempre</button></div></div>`;
    bindBrandForm();
    const sacQ = r?.q?.get('sacolinha');
    if (sacQ) { if (sacQ === 'ok') { api('/meta/catalog').then(d => d.products.length ? api('/meta/catalog', { method: 'POST', body: { ids: d.products.map(p => p.id) } }) : null).then(x => toast(x ? `${x.added} produtos importados da sacolinha.` : 'Sacolinha conectada, mas sem produtos com foto e preço.', 4500)).catch(e => toast(e.message, 4500)); }
      else toast({ sem_catalogo: 'Não achei uma loja do Instagram com catálogo nessa conta.', sem_conta: 'Essa conta do Facebook não tem Instagram comercial ligado.', cancelado: 'Conexão cancelada.' }[sacQ] || 'Não consegui abrir a sacolinha. Tente de novo.', 4500);
      history.replaceState(null, '', location.pathname + '#/conta'); }
    if ($('#sac-off')) $('#sac-off').onclick = async () => { await api('/meta', { method: 'DELETE' }); await loadMe(); toast('Sacolinha desconectada.'); viewAccount(); };
    $('#del-acc').onclick = () => { $('#del-confirm').hidden = false; $('#del-acc').hidden = true; $('#del-word').focus(); };
    $('#del-go').onclick = async () => { if ($('#del-word').value.trim().toUpperCase() !== 'EXCLUIR') { $('#del-word').focus(); return; } await api('/account', { method: 'DELETE' }); me = null; ss.del('iris-onb'); location.href = '/'; };
    if (r?.q?.get('ig')) igToast(r.q.get('ig'));
    if ($('#ig-off')) $('#ig-off').onclick = async () => { await api('/instagram', { method: 'DELETE' }); await loadMe(); toast('Instagram desconectado.'); viewAccount(); };
    $('#f').onsubmit = async e => { e.preventDefault(); await api('/brand', { method: 'PUT', body: readBrandForm(b) }); await loadMe(); toast('Marca salva.'); };
    if ($('#wa-code')) $('#wa-code').onclick = async () => { const d = await api('/wa/code', { method: 'POST' }); $('#wa-out').innerHTML = `<p class="lead">Envie <b>${esc(d.text)}</b> para <b>${esc(d.phone || 'o número da Íris')}</b>. Vale por 30 minutos.</p>`; };
    $('#out').onclick = async () => { await api('/auth/logout', { method: 'POST' }); me = null; ss.del('iris-onb'); location.hash = '#/start'; };
  }
  function viewLogin(r) {
    if (r?.q?.get('google')) googleToast(r.q.get('google'));
    if (me.user) { location.hash = me.brand ? '#/home' : '#/start'; return; }
    main.innerHTML = `<div class="stack center"><img class="mark" src="/assets/iris-mark.png" alt=""><h1>Entrar na Íris</h1><p class="lead">${loginLead()}</p></div>
      <form class="card" id="f">${igBeta() ? `<a class="btn btn-ig btn-block" id="ig-login" href="/api/instagram/connect?back=start">${logo('instagram')}Entrar com Instagram</a>` : ''}${googleBtn('login')}${emailFields()}</form>`;
    if ($('#ig-login')) $('#ig-login').onclick = () => ONB.set({ step: 'ig' });
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
