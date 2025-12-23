// ===========================================
// Configuração do Ambiente
// ===========================================

import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  // Servidor
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Banco de Dados
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),

  // Anthropic (Claude)
  ANTHROPIC_API_KEY: z.string(),

  // OpenAI (opcional, para Whisper)
  OPENAI_API_KEY: z.string().optional(),

  // Configurações de resumo
  MAX_SUMMARY_TOKENS: z.string().default('150'),
  SUMMARY_MODEL: z.string().default('claude-3-haiku-20240307'),

  // Auto-reply
  DEFAULT_AUTO_REPLY_MESSAGE: z.string().default(
    'Recebi sua mensagem! No momento estou em atendimento, mas retorno assim que possível. Obrigado pela compreensão.'
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

export const config = {
  server: {
    port: parseInt(env.PORT, 10),
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
  },
  database: {
    url: env.DATABASE_URL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: '7d',
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  },
  anthropic: {
    apiKey: env.ANTHROPIC_API_KEY,
  },
  openai: {
    apiKey: env.OPENAI_API_KEY,
  },
  summary: {
    maxTokens: parseInt(env.MAX_SUMMARY_TOKENS, 10),
    model: env.SUMMARY_MODEL,
  },
  autoReply: {
    defaultMessage: env.DEFAULT_AUTO_REPLY_MESSAGE,
  },
};
