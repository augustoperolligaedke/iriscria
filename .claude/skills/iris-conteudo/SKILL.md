---
name: iris-conteudo
description: Regras de produção de conteúdo da Íris (feed, carrossel, reels e funil). Use antes de mexer em prompts, geração de copy, prompt de vídeo, renderização das artes ou formatos em lib/llm.js, lib/generate.js, lib/higgsfield.js, lib/playbook.js ou no renderizador de public/app/app.js.
---

# Produção de conteúdo da Íris

A fonte única das regras é `lib/playbook.js`. Prompt, travas e renderizador seguem esse arquivo. Nunca duplique regra em outro lugar: importe do playbook.

## Funil
| Formato | Etapa | Papel |
|---|---|---|
| Reels | Topo | Ser descoberto. Sem preço, oferta ou pedido de compra. |
| Carrossel | Meio | Convencer: detalhes, uso, combinações, prova. |
| Feed | Fundo | Vender: produto, preço e condição claros. |

A etapa vai no contexto da IA (`RULES_PROMPT`) e fica salva em `spec.funnel`. A oferta é descartada no reels.

## Arte estática (feed e carrossel)
- Hook é o título. Body é o subtítulo.
- O CTA é a própria foto do produto. Nada de botão, pílula de preço, "clique", "link na bio", "deslize", @, #, emoji, logo ou endereço do site na arte.
- Padrão de qualidade (referência do usuário, 19/10/2026): cena fotográfica gerada por IA com o produto real como referência e espaço livre no alto; título enorme em 2 a 3 linhas com a última parte na cor de destaque da marca; subtítulo curto de fatos da embalagem. Sem logo e sem site.
- Pedido de ação só na legenda.

## Reels
- Vídeo do produto em motion suave ou cena natural de uso. Nada de texto, logo, preço ou gráfico no vídeo.
- O produto não muda de forma, cor, estampa ou rótulo.
- O gancho é a primeira linha da legenda. A capa tem só a foto e o gancho pequeno no alto.

## Travas obrigatórias
1. Toda saída da IA passa por `enforce(format, out, product)` antes de ser salva. Não confie no modelo para limite, CTA ou funil.
2. Todo prompt de vídeo passa por `videoPrompt()`, que sempre anexa a proibição de texto na tela.
3. Mudou regra, limite ou campo: atualize `scripts/check-playbook.mjs` com um caso que quebraria sem a mudança e rode `node scripts/check-playbook.mjs`.
4. Mudou o renderizador: gere as artes com uma foto de `public/assets/photos/` e olhe as imagens no tamanho real (1080×1350 e 1080×1920) antes de dizer que está pronto. A miniatura do Quick Look corta em quadrado e engana.
5. `./build.sh` roda a checagem e bloqueia o deploy se falhar. Não contorne.

## Campos de copy
- Feed: `hook`, `body`, `caption`, `hashtags`.
- Carrossel: `slides[{title, body}]` (title é o hook do slide), `caption`, `hashtags`.
- Reels: `hook`, `caption`, `hashtags`, `video_style` (`motion` ou `natural`), `video_prompt`.
- Conteúdos antigos podem ter `headline` (feed) ou `title` (reels). O renderizador aceita os dois. Não apague esse fallback.
