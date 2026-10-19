#!/bin/sh
# Monta index.html (produção) e artifact.html (preview com formulário em modo demonstração) a partir de src/.
set -e
cd "$(dirname "$0")"
node scripts/check-playbook.mjs > /dev/null || { node scripts/check-playbook.mjs; echo "Build bloqueado: playbook de conteúdo quebrado."; exit 1; }
{
  printf '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  cat src/head.html
  printf '</head>\n<body>\n'
  cat src/body.html
  printf '</body>\n</html>\n'
} > public/index.html
mkdir -p dist
{ cat src/head.html; sed -e 's|<a class="skip" href="#main">|<span hidden data-demo-flag></span><a class="skip" href="#main">|' src/body.html; } > dist/artifact.html
node scripts/build-lps.mjs
echo "index.html e dist/artifact.html gerados"
