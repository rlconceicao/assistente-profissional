# 📱 Assistente Profissional - App Mobile

App React Native com Expo para profissionais liberais gerenciarem mensagens com resumos automáticos.

## 🚀 Funcionalidades

- ✅ Login com Google OAuth
- ✅ Lista de mensagens com resumos
- ✅ Detalhes da mensagem com conteúdo original
- ✅ Envio de respostas
- ✅ Configuração de resposta automática
- ✅ Sincronização com Gmail
- ✅ Indicadores de status (lida, respondida, etc.)
- ✅ Badge de mensagens não lidas

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app no celular (para desenvolvimento)
- Backend rodando (ver `/backend/README.md`)

## 🛠️ Setup

### 1. Instalar dependências

```bash
cd mobile
npm install
```

### 2. Configurar variáveis

Edite o arquivo `src/config/index.ts`:

```typescript
// URL do seu backend
const DEV_API_URL = 'http://SEU_IP_LOCAL:3000';
const PROD_API_URL = 'https://sua-api.com';

// Google OAuth Client IDs
google: {
  iosClientId: 'SEU_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'SEU_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'SEU_WEB_CLIENT_ID.apps.googleusercontent.com',
},
```

**Importante:** Para desenvolvimento local, use o IP da sua máquina (não `localhost`), pois o celular precisa acessar o backend na rede.

### 3. Configurar Google OAuth para Mobile

1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crie credenciais OAuth para cada plataforma:

**iOS:**
- Tipo: iOS
- Bundle ID: `com.yourcompany.assistentepro`

**Android:**
- Tipo: Android
- Package name: `com.yourcompany.assistentepro`
- SHA-1: Execute `expo credentials:manager` para obter

**Web (para Expo Go):**
- Tipo: Web application
- Authorized redirect URIs: `https://auth.expo.io/@seu-usuario/assistente-profissional`

### 4. Iniciar o app

```bash
# Desenvolvimento
npm start

# Ou diretamente no simulador
npm run ios
npm run android
```

### 5. Testar no celular

1. Instale o app **Expo Go** no seu celular
2. Escaneie o QR code que aparece no terminal
3. O app abrirá no Expo Go

## 📁 Estrutura do Projeto

```
mobile/
├── app/                      # Telas (Expo Router)
│   ├── _layout.tsx          # Layout root
│   ├── index.tsx            # Redirect inicial
│   ├── login.tsx            # Tela de login
│   ├── (tabs)/              # Tabs principais
│   │   ├── _layout.tsx      # Layout das tabs
│   │   ├── index.tsx        # Inbox de mensagens
│   │   └── settings.tsx     # Configurações
│   └── message/
│       └── [id].tsx         # Detalhes da mensagem
│
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/             # Componentes base (Button, Card, etc.)
│   │   └── MessageItem.tsx # Item da lista de mensagens
│   ├── config/             # Configurações
│   ├── services/           # API service
│   ├── stores/             # Estado global (Zustand)
│   ├── theme/              # Cores, espaçamentos, etc.
│   └── types/              # TypeScript types
│
├── assets/                  # Imagens, ícones, etc.
├── app.json                # Configuração do Expo
├── package.json
└── tsconfig.json
```

## 🎨 Telas

### Login
- Autenticação com Google
- Features do app destacadas
- Links para termos e privacidade

### Inbox (Home)
- Estatísticas (hoje, não lidas, respondidas)
- Status da resposta automática (on/off)
- Botão de sincronizar Gmail
- Lista de mensagens com:
  - Avatar do remetente
  - Ícone da fonte (Gmail, WhatsApp)
  - Badge de áudio (se aplicável)
  - Resumo da mensagem
  - Status (não lida, lida, respondida)
  - Indicador de resposta automática

### Detalhes da Mensagem
- Informações do remetente
- Card de resumo destacado
- Conteúdo original (com player de áudio se for áudio)
- Histórico de respostas
- Campo para enviar resposta

### Configurações
- Perfil do usuário
- Resposta automática:
  - Toggle on/off
  - Edição da mensagem
  - Horário de funcionamento
  - Dias ativos
- Conexões (Gmail, WhatsApp)
- Outras opções (conta, assinatura, LGPD)
- Logout

## 🔧 Customização

### Cores

Edite `src/theme/index.ts` para alterar o esquema de cores:

```typescript
export const colors = {
  primary: '#3B82F6',      // Azul principal
  success: '#10B981',      // Verde
  warning: '#F59E0B',      // Amarelo
  error: '#EF4444',        // Vermelho
  // ...
};
```

### Fontes

Para usar fontes customizadas, instale com Expo:

```bash
npx expo install expo-font @expo-google-fonts/inter
```

## 📦 Build para Produção

### EAS Build (Recomendado)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar projeto
eas build:configure

# Build para iOS
eas build --platform ios

# Build para Android
eas build --platform android
```

### Build Local

```bash
# iOS (requer macOS)
npx expo run:ios --configuration Release

# Android
npx expo run:android --variant release
```

## 🐛 Troubleshooting

### "Network request failed"
- Verifique se o backend está rodando
- Use o IP da máquina (não localhost) em `DEV_API_URL`
- Certifique-se de que celular e computador estão na mesma rede

### Erro de OAuth
- Verifique se os Client IDs estão corretos
- Confirme que os redirect URIs estão configurados no Google Console
- Para Expo Go, use o Client ID Web

### "Module not found"
```bash
# Limpe o cache
npx expo start --clear
```

## 📄 Licença

MIT
