# 📱 Assistente Profissional - Backend API

API para o aplicativo de resumo automático de mensagens para profissionais liberais (médicos, advogados, etc.).

## 🚀 Funcionalidades

- ✅ Integração com Gmail (OAuth 2.0)
- ✅ Resumo automático de mensagens com IA (Claude)
- ✅ Resposta automática configurável
- ✅ Transcrição de áudios (preparado para Whisper)
- ✅ Autenticação JWT
- ✅ Configurações de horário de funcionamento

## 📋 Pré-requisitos

- Node.js 20+
- PostgreSQL 14+
- Redis (opcional, para filas)
- Conta Google Cloud Platform
- Chave API da Anthropic (Claude)

## 🛠️ Setup Inicial

### 1. Clonar e instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Banco de dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/assistente_db"

# JWT (gere uma chave segura)
JWT_SECRET="sua-chave-super-secreta-aqui"

# Google OAuth (ver instruções abaixo)
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"

# Anthropic (Claude)
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Configurar Google Cloud Platform

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Ative a **Gmail API**
4. Vá em **APIs & Services > Credentials**
5. Clique em **Create Credentials > OAuth client ID**
6. Selecione **Web application**
7. Adicione as URIs:
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
8. Copie o **Client ID** e **Client Secret** para o `.env`
9. Configure a tela de consentimento OAuth:
   - Vá em **OAuth consent screen**
   - Adicione os escopos:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`

### 4. Configurar banco de dados

```bash
# Criar as tabelas
npm run db:push

# Ou usar migrations (recomendado para produção)
npm run db:migrate

# Visualizar dados (opcional)
npm run db:studio
```

### 5. Iniciar o servidor

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start
```

## 📡 Endpoints da API

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/auth/google` | Inicia fluxo OAuth |
| GET | `/auth/google/callback` | Callback OAuth |
| GET | `/auth/me` | Dados do usuário autenticado |
| PATCH | `/auth/me` | Atualizar perfil |

### Mensagens

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/messages` | Listar mensagens |
| GET | `/messages/:id` | Detalhes da mensagem |
| POST | `/messages/sync/gmail` | Sincronizar Gmail |
| PATCH | `/messages/:id/read` | Marcar como lida |
| POST | `/messages/:id/reply` | Enviar resposta |
| GET | `/messages/stats` | Estatísticas |

### Configurações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/settings/auto-reply` | Config auto-resposta |
| PATCH | `/settings/auto-reply` | Atualizar config |
| POST | `/settings/auto-reply/toggle` | Ativar/desativar |
| GET | `/settings/connections` | Listar conexões |
| GET | `/settings/message-templates` | Templates prontos |

## 🔐 Autenticação

A API usa JWT para autenticação. Após o OAuth com Google, você recebe um token:

```bash
# Inclua o token no header
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## 📝 Exemplos de Uso

### Listar mensagens

```bash
curl -X GET http://localhost:3000/messages \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Sincronizar Gmail

```bash
curl -X POST http://localhost:3000/messages/sync/gmail \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Configurar resposta automática

```bash
curl -X PATCH http://localhost:3000/settings/auto-reply \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "message": "Estou em atendimento, retorno em breve!",
    "startTime": "08:00",
    "endTime": "18:00",
    "activeDays": [1, 2, 3, 4, 5]
  }'
```

## 🏗️ Estrutura do Projeto

```
backend/
├── prisma/
│   └── schema.prisma      # Schema do banco de dados
├── src/
│   ├── config/
│   │   ├── env.ts         # Variáveis de ambiente
│   │   └── database.ts    # Cliente Prisma
│   ├── services/
│   │   ├── gmail.service.ts         # Integração Gmail
│   │   ├── ai.service.ts            # Resumos com Claude
│   │   └── message-processing.service.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── messages.routes.ts
│   │   └── settings.routes.ts
│   └── server.ts          # Entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## 🧪 Testando Localmente

1. Inicie o servidor: `npm run dev`
2. Acesse: `http://localhost:3000/auth/google`
3. Faça login com sua conta Google
4. Use o token retornado para chamar os endpoints

## 📦 Próximos Passos

- [ ] Adicionar integração com WhatsApp Business API
- [ ] Implementar transcrição de áudio com Whisper
- [ ] Adicionar filas com BullMQ para processamento assíncrono
- [ ] Criar webhooks para sync em tempo real
- [ ] Implementar push notifications
- [ ] Adicionar testes automatizados

## 🐛 Troubleshooting

### Erro "redirect_uri_mismatch"

Verifique se a URI de callback no Google Cloud Console corresponde exatamente à configurada no `.env`.

### Erro "Token expirado"

O token de acesso expira após 1 hora. O sistema tenta renovar automaticamente se você tiver o refresh_token.

### Erro ao conectar no banco

Verifique se o PostgreSQL está rodando e a URL está correta no `.env`.

## 📄 Licença

MIT
