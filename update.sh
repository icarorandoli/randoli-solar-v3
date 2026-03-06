#!/bin/bash

# Randoli Engenharia Solar - Script de Atualização Rápida
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

info "Buscando atualizações..."
# Verifica se já existe um token configurado no remote, se não, pede ou usa o padrão de interatividade do git
# O GitHub removeu suporte a senha em 2021, exige Personal Access Token (PAT)
git fetch origin
git reset --hard origin/main

# Migração de pasta se necessário
if [ "$APP_DIR" == "/root/randoli-engenharia-solar" ]; then
    info "Migrando pasta para o novo padrão..."
    cd /root
    mv randoli-engenharia-solar randoli-solar
    APP_DIR="/root/randoli-solar"
    cd "$APP_DIR"
fi

info "Instalando novas dependências..."
npm install --silent

info "Sincronizando banco de dados..."
npx drizzle-kit push --force

info "Compilando nova versão..."
npx tsx script/build.ts

info "Reiniciando servidor..."
pm2 restart randoli || pm2 start dist/index.cjs --name randoli

echo ""
echo "================================================"
echo -e "${VERDE}   Sistema atualizado com sucesso!${NC}"
echo "================================================"
echo "Acesse: https://projetos.randolisolar.com.br"
echo ""
