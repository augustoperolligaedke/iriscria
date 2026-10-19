// Envio do código de acesso. Com RESEND_API_KEY envia por e-mail; sem chave, apenas registra no log.
export async function sendOtpEmail(env, to, code) {
  if (!env.RESEND_API_KEY) { console.log(`[Íris] código de acesso para ${to}: ${code}`); return { sent: false }; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM || 'Íris <onboarding@resend.dev>',
      to: [to],
      subject: `${code} é o seu código da Íris`,
      text: `Seu código de acesso à Íris é ${code}. Ele vale por 10 minutos.\n\nSe você não pediu este código, ignore este e-mail.`,
    }),
  });
  if (!r.ok) { console.error('resend', r.status, await r.text()); return { sent: false }; }
  return { sent: true };
}
