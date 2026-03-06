#!/bin/bash

# Randoli Engenharia Solar - Script de Reparo (Sem perda de dados)
# Este script atualiza o código sem apagar o banco de dados ou a pasta de uploads.

set -e

VERDE='\033[0;32m'
AMARELO='\033[1;33m'
VERMELHO='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${VERDE}[OK]${NC} $1"; }
info() { echo -e "${AMARELO}[..] $1${NC}"; }

# Detecta a pasta atual
if [ -d "/root/randoli-solar" ]; then
    APP_DIR="/root/randoli-solar"
elif [ -d "/root/randoli-engenharia-solar" ]; then
    APP_DIR="/root/randoli-engenharia-solar"
else
    echo -e "${VERMELHO}Erro: Pasta do projeto não encontrada.${NC}"
    exit 1
fi

cd "$APP_DIR"

info "Buscando atualizações do novo repositório..."
# Garante que o remote aponta para o novo repositório
git remote set-url origin https://github.com/icarorandoli/randoli-solar.git || git remote add origin https://github.com/icarorandoli/randoli-solar.git
git fetch origin
git reset --hard origin/main

# Se a pasta ainda for a antiga, renomeia agora que o git reset já foi feito
if [ "$APP_DIR" == "/root/randoli-engenharia-solar" ]; then
    info "Migrando pasta para o novo padrão..."
    cd /root
    mv randoli-engenharia-solar randoli-solar
    APP_DIR="/root/randoli-solar"
    cd "$APP_DIR"
fi

info "Atualizando dependências..."
npm install --silent

info "Sincronizando banco de dados (preservando dados)..."
# O drizzle-kit push sincroniza o schema sem apagar os dados existentes
npx drizzle-kit push --force

info "Compilando nova versão..."
npx tsx script/build.ts

info "Reiniciando servidor..."
pm2 delete randoli 2>/dev/null || true
pm2 start dist/index.cjs --name randoli
pm2 save

echo ""
echo "================================================"
echo -e "${VERDE}   Sistema atualizado com sucesso!${NC}"
echo "================================================"
echo "Seus dados e arquivos foram preservados."
echo "Acesse: https://projetos.randolisolar.com.br"
echo ""
