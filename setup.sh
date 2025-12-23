#!/bin/bash

# ===========================================
# Script de Setup - Assistente Profissional
# ===========================================

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🚀 Setup - Assistente Profissional                     ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ==========================================
# Verificar pré-requisitos
# ==========================================
echo "📋 Verificando pré-requisitos..."

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale a versão 20 ou superior.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js versão 20+ necessária. Versão atual: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não encontrado.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# Docker (opcional)
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker $(docker -v | cut -d' ' -f3 | tr -d ',')${NC}"
    HAS_DOCKER=true
else
    echo -e "${YELLOW}⚠️  Docker não encontrado. Você precisará configurar PostgreSQL e Redis manualmente.${NC}"
    HAS_DOCKER=false
fi

echo ""

# ==========================================
# Instalar dependências
# ==========================================
echo "📦 Instalando dependências..."
cd backend
npm install
echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# ==========================================
# Configurar ambiente
# ==========================================
if [ ! -f .env ]; then
    echo "⚙️  Criando arquivo .env..."
    cp .env.example .env
    echo -e "${GREEN}✅ Arquivo .env criado${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o arquivo backend/.env com suas credenciais!${NC}"
else
    echo -e "${GREEN}✅ Arquivo .env já existe${NC}"
fi

echo ""

# ==========================================
# Iniciar serviços com Docker
# ==========================================
if [ "$HAS_DOCKER" = true ]; then
    echo "🐳 Iniciando PostgreSQL e Redis com Docker..."
    cd ..
    docker-compose up -d postgres redis
    
    # Aguarda serviços ficarem prontos
    echo "⏳ Aguardando serviços ficarem prontos..."
    sleep 5
    
    echo -e "${GREEN}✅ Serviços iniciados${NC}"
    cd backend
else
    echo -e "${YELLOW}⚠️  Configure PostgreSQL e Redis manualmente e atualize o .env${NC}"
fi

echo ""

# ==========================================
# Configurar banco de dados
# ==========================================
echo "🗄️  Configurando banco de dados..."

# Verifica se consegue conectar
if npm run db:push 2>/dev/null; then
    echo -e "${GREEN}✅ Banco de dados configurado${NC}"
else
    echo -e "${YELLOW}⚠️  Não foi possível configurar o banco. Verifique a conexão e execute: npm run db:push${NC}"
fi

echo ""

# ==========================================
# Instruções finais
# ==========================================
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ✅ Setup concluído!                                     ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Próximos passos:"
echo ""
echo "   1. Configure as credenciais no arquivo backend/.env:"
echo "      - GOOGLE_CLIENT_ID"
echo "      - GOOGLE_CLIENT_SECRET"
echo "      - ANTHROPIC_API_KEY"
echo "      - JWT_SECRET"
echo ""
echo "   2. Inicie o servidor de desenvolvimento:"
echo "      cd backend"
echo "      npm run dev"
echo ""
echo "   3. Acesse: http://localhost:3000/auth/google"
echo ""
echo "   4. Faça login com sua conta Google"
echo ""
echo "   5. Use o token retornado para testar a API"
echo ""
echo "📚 Documentação: backend/README.md"
echo ""
