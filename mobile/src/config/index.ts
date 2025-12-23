// ===========================================
// Configuração do App Mobile
// ===========================================

// URL da API - altere para sua URL de produção
const DEV_API_URL = 'http://localhost:3000';
const PROD_API_URL = 'https://sua-api.com';

export const config = {
  // API
  apiUrl: __DEV__ ? DEV_API_URL : PROD_API_URL,

  // Google OAuth
  google: {
    // Obtenha em: https://console.cloud.google.com
    // Use o Client ID do tipo "iOS" ou "Android" conforme a plataforma
    iosClientId: 'SEU_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'SEU_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'SEU_WEB_CLIENT_ID.apps.googleusercontent.com',
  },

  // Configurações do App
  app: {
    name: 'Assistente Pro',
    version: '1.0.0',
  },

  // Storage keys
  storage: {
    authToken: 'auth_token',
    user: 'user_data',
    onboardingComplete: 'onboarding_complete',
  },
};

// Tipos
export type Config = typeof config;
