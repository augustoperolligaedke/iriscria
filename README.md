# iris · landing + MVP

Landing page de captação e o app web (PWA, mobile first) da iris: lê a marca da loja, cria feed, carrossel e reels com a cara da marca, controla créditos por plano. Roda em Cloudflare Pages (estático + Functions), D1, R2 e KV.

## Estrutura
- `public/` → site estático publicado: landing (`index.html`, gerado por `./build.sh` a partir de `src/`), `app/` (PWA), `obrigado.html`, páginas legais, `assets/`.
- `functions/` → API (Pages Functions): auth por código no e-mail, marca, produtos, upload, geração, créditos, Stripe, WhatsApp (Tyxter), leads.
- `lib/` → módulos: `brand.js` (lê site: cores, fonte, fotos, textos), `llm.js` (copy via API compatível com OpenAI; fallback sem chave), `higgsfield.js` (reels), `generate.js` (créditos + geração), `plans.js` (planos), `tyxter.js`, `mailer.js`, `auth.js`.
- `migrations/` → schema D1. `wrangler.toml` → bindings.

## Rodar local
```sh
cp .dev.vars.example .dev.vars          # preencha as chaves que tiver; sem chaves o MVP roda em modo prévia
npx wrangler d1 migrations apply iris --local
PATH="/opt/homebrew/bin:$PATH" npx -y wrangler@4.151.2 pages dev public --port 4000 --ip 0.0.0.0   # precisa de Node 22+ e do Postgres local na porta 54329 (localConnectionString do wrangler.toml)
```
Abra http://127.0.0.1:4000 (landing) e http://127.0.0.1:4000/app/ (app). Sem `RESEND_API_KEY`, o código de acesso aparece preenchido na tela (`DEV_SHOW_CODE=1`).

## Fluxo do produto
1. Landing: campo "site ou @" → `/app/#/start?loja=`.
2. Onboarding: lê o site (cores, fonte, fotos, tom de voz, ICP) → confirma marca → escolhe produto → e-mail + código → gera 1 carrossel + 1 reels de presente.
3. App: criar (feed, carrossel, reels), editar texto, aprovar, baixar PNGs (renderizados no navegador em SVG → PNG) e o MP4 do reels.
4. Créditos: `lib/plans.js`. Posts (feed/carrossel) e reels por mês = escopo semanal × 4.

## Integrações
- Reels: Higgsfield (`HF_API_KEY_ID`/`HF_API_KEY_SECRET`, modelo em `HF_VIDEO_MODEL`). Sem chave: prévia animada no app.
- Texto: `LLM_API_KEY` + `LLM_BASE_URL` + `LLM_MODEL` (OpenAI por padrão; OpenRouter trocando a base URL).
- Pagamento com cartão: Stripe Checkout em assinatura que renova sozinha (`STRIPE_*`), webhook em `/api/billing/webhook`.
- Pagamento com Pix: AbacatePay v2, pré-pago mensal ou anual (`ABACATE_*`). `ABACATE_API_KEY=... node scripts/abacatepay-setup.mjs --pages` cria os produtos (um por plano, mensal e anual com preço de 10 meses), registra o webhook `APP_URL/api/billing/abacatepay?webhookSecret=...` (evento `checkout.completed`) e grava os secrets no Pages. Sem pagamento ligado, o botão do plano registra interesse (lead `plano`) e a pessoa segue no grátis. O app avisa 5 dias antes de vencer. Migração `0003_payments.sql`.
- WhatsApp: Tyxter (`TYXTER_*`), webhook em `/api/wa/webhook`. No app, Conta → Gerar código → enviar "iris CÓDIGO" ao número da iris. Depois, foto com nome e preço na legenda vira produto.

## Banco: Supabase (Postgres) via Hyperdrive
- `lib/db.js` usa Postgres quando existe `HYPERDRIVE` (produção) ou `DATABASE_URL` (local); senão usa o D1. As consultas usam `?` nos dois.
- Esquema: `supabase/schema.sql` (gerado das migrações do D1, com RLS ligado em todas as tabelas: a API pública do Supabase não lê nada).
- Copiar dados do D1: `node scripts/d1-to-postgres.mjs --remote saida.sql` e depois `psql "<conexão>" -f saida.sql`.
- Produção: criar o projeto no Supabase (região São Paulo), `npx wrangler hyperdrive create iris-db --connection-string="postgres://..."` e adicionar no `wrangler.toml`:
  `[[hyperdrive]]` com `binding = "HYPERDRIVE"` e o `id` devolvido.

## Instagram (publicar direto)
- API do Instagram com login do Instagram: conta comercial ou de criador, sem página do Facebook. Permissões `instagram_business_basic` e `instagram_business_content_publish`.
- Crie o app em developers.facebook.com, adicione o produto "Instagram API with Instagram Login", cadastre o redirect `APP_URL/api/instagram/callback` e configure `IG_APP_ID` e `IG_APP_SECRET`.
- Em modo de desenvolvimento só publica em contas adicionadas como testadoras do app. Para qualquer loja, a Meta exige verificação da empresa e App Review da permissão de publicação.
- O app renderiza as artes em JPEG, sobe para o R2 e o Instagram baixa pela URL pública. Por isso a publicação não funciona em localhost e depende do R2 ligado em produção.
- Migração `0002_instagram.sql`: aplique com `npx wrangler d1 migrations apply iris --remote` antes do deploy.

## Publicar
```sh
npx wrangler d1 create iris                 # copie o database_id para wrangler.toml
npx wrangler r2 bucket create iris-media
npx wrangler kv namespace create LEADS      # copie o id para wrangler.toml
npx wrangler d1 migrations apply iris --remote
npx wrangler pages deploy public --project-name iriscria
```
Configure os secrets do `.dev.vars.example` no projeto Pages e ajuste `APP_URL` para o domínio final.
