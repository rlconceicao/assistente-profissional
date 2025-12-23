// ===========================================
// Servidor Principal - Assistente Profissional
// ===========================================

import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config/env.js';
import { prisma } from './config/database.js';
import { authRoutes } from './routes/auth.routes.js';
import { messageRoutes } from './routes/messages.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';

// Extender tipos do Fastify
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; email: string };
    user: { userId: string; email: string };
  }
}

// ==========================================
// Criação do App
// ==========================================
async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.server.isDev ? 'info' : 'warn',
      transport: config.server.isDev
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  });

  // ==========================================
  // Plugins
  // ==========================================

  // CORS
  await app.register(cors, {
    origin: config.server.isDev ? true : ['https://seuapp.com'],
    credentials: true,
  });

  // JWT
  await app.register(jwt, {
    secret: config.jwt.secret,
  });

  // ==========================================
  // Decorators
  // ==========================================

  // Decorator de autenticação
  app.decorate('authenticate', async function (request: FastifyRequest, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Não autorizado' });
    }
  });

  // ==========================================
  // Rotas
  // ==========================================

  // Health check
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // API info
  app.get('/', async () => {
    return {
      name: 'Assistente Profissional API',
      version: '1.0.0',
      description: 'API para resumo automático de mensagens',
      endpoints: {
        auth: '/auth/*',
        messages: '/messages/*',
        settings: '/settings/*',
      },
    };
  });

  // Registra rotas
  await app.register(authRoutes);
  await app.register(messageRoutes);
  await app.register(settingsRoutes);

  // ==========================================
  // Error Handler Global
  // ==========================================
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    // Erros de validação Zod
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: error.issues,
      });
    }

    // Erros de JWT
    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      return reply.status(401).send({
        error: 'Token não fornecido',
      });
    }

    // Erro genérico
    return reply.status(error.statusCode || 500).send({
      error: error.message || 'Erro interno do servidor',
    });
  });

  return app;
}

// ==========================================
// Inicialização
// ==========================================
async function start() {
  try {
    // Conecta ao banco
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');

    // Build app
    const app = await buildApp();

    // Start server
    await app.listen({ port: config.server.port, host: '0.0.0.0' });

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Assistente Profissional API                         ║
║                                                           ║
║   Servidor rodando em: http://localhost:${config.server.port}            ║
║   Ambiente: ${config.server.isDev ? 'desenvolvimento' : 'produção'}                             ║
║                                                           ║
║   Endpoints:                                              ║
║   - GET  /health           → Health check                 ║
║   - GET  /auth/google      → Iniciar OAuth                ║
║   - GET  /auth/me          → Usuário atual                ║
║   - GET  /messages         → Listar mensagens             ║
║   - POST /messages/sync/gmail → Sincronizar Gmail         ║
║   - GET  /settings/auto-reply → Config auto-resposta      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Desligando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Desligando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

// Inicia o servidor
start();
