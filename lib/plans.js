// Planos: escopo semanal explícito; limites mensais = semanal × 4.
export const PLANS = {
  free:   { name: 'Grátis',  price: 0,   weekly: { posts: 0, reels: 0 }, monthly: { posts: 2, reels: 0 }, perks: ['2 posts por mês (feed ou carrossel)', 'Integrações e programação de postagens', 'Sem cartão'] },
  basico: { name: 'Básico',  price: 59,  weekly: { posts: 3, reels: 1 }, monthly: { posts: 12, reels: 4 }, perks: ['3 posts por semana', '1 reels por semana', 'Marca salva: cores, fonte e tom de voz'] },
  pro:    { name: 'Pro',     price: 149, weekly: { posts: 7, reels: 3 }, monthly: { posts: 28, reels: 12 }, perks: ['7 posts por semana', '3 reels por semana', 'WhatsApp: mande a foto, receba o post', 'Agenda de postagem (em breve)'] },
  loja:   { name: 'Loja',    price: 299, weekly: { posts: 14, reels: 7 }, monthly: { posts: 56, reels: 28 }, perks: ['14 posts por semana', '7 reels por semana', 'Publicação automática no Instagram (em breve)', 'Até 3 marcas (em breve)'] },
};
export const GIFT = { posts: 1, reels: 1 }; // presente do onboarding: 1 carrossel + 1 reels
export const isPost = f => f === 'feed' || f === 'carousel';
export function planOf(user) {
  const p = PLANS[user?.plan] ? user.plan : 'free';
  if (p !== 'free' && user.plan_until && user.plan_until < new Date().toISOString()) return 'free';
  return p;
}
