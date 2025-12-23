// ===========================================
// Rotas de Autenticação
// ===========================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';
import { gmailService } from '../services/gmail.service.js';
import { Provider } from '@prisma/client';

// Schema de validação
const googleCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

export async function authRoutes(app: FastifyInstance) {
  // ==========================================
  // Início do fluxo OAuth com Google
  // ==========================================
  app.get('/auth/google', async (request: FastifyRequest, reply: FastifyReply) => {
    const authUrl = gmailService.getAuthUrl();
    return reply.redirect(authUrl);
  });

  // ==========================================
  // Callback do OAuth Google
  // ==========================================
  app.get(
    '/auth/google/callback',
    async (
      request: FastifyRequest<{
        Querystring: { code?: string; error?: string; state?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { code, error } = request.query;

      if (error) {
        return reply.status(400).send({
          error: 'Autorização negada',
          message: error,
        });
      }

      if (!code) {
        return reply.status(400).send({
          error: 'Código de autorização não fornecido',
        });
      }

      try {
        // Troca código por tokens
        const tokens = await gmailService.exchangeCodeForTokens(code);

        if (!tokens.access_token) {
          throw new Error('Token de acesso não recebido');
        }

        // Obtém informações do usuário
        const profile = await gmailService.getUserProfile(tokens.access_token);

        // Cria ou atualiza usuário
        let user = await prisma.user.findUnique({
          where: { email: profile.email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name,
            },
          });

          // Cria configurações padrão de auto-reply
          await prisma.autoReplySettings.create({
            data: {
              userId: user.id,
              enabled: true,
              message: config.autoReply.defaultMessage,
            },
          });
        }

        // Cria ou atualiza conexão com Gmail
        await prisma.connection.upsert({
          where: {
            userId_provider: {
              userId: user.id,
              provider: Provider.GMAIL,
            },
          },
          update: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || undefined,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
          },
          create: {
            userId: user.id,
            provider: Provider.GMAIL,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || undefined,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
          },
        });

        // Gera JWT
        const token = app.jwt.sign(
          {
            userId: user.id,
            email: user.email,
          },
          { expiresIn: config.jwt.expiresIn }
        );

        // Em produção, redirecionar para o app mobile com o token
        // Por enquanto, retorna o token diretamente
        return reply.send({
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        });
      } catch (err) {
        console.error('Erro no callback OAuth:', err);
        return reply.status(500).send({
          error: 'Erro ao processar autenticação',
          message: err instanceof Error ? err.message : 'Erro desconhecido',
        });
      }
    }
  );

  // ==========================================
  // Verificar token / Obter usuário atual
  // ==========================================
  app.get(
    '/auth/me',
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        include: {
          connections: {
            select: {
              provider: true,
              createdAt: true,
            },
          },
          autoReplySettings: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        profession: user.profession,
        plan: user.plan,
        connections: user.connections,
        autoReplySettings: user.autoReplySettings,
        createdAt: user.createdAt,
      };
    }
  );

  // ==========================================
  // Atualizar perfil do usuário
  // ==========================================
  app.patch(
    '/auth/me',
    { preHandler: [app.authenticate] },
    async (
      request: FastifyRequest<{
        Body: { name?: string; profession?: string; phone?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { name, profession, phone } = request.body;

      const user = await prisma.user.update({
        where: { id: request.user.userId },
        data: {
          ...(name && { name }),
          ...(profession && { profession }),
          ...(phone && { phone }),
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        profession: user.profession,
        phone: user.phone,
      };
    }
  );

  // ==========================================
  // Logout (desconectar serviço)
  // ==========================================
  app.delete(
    '/auth/connections/:provider',
    { preHandler: [app.authenticate] },
    async (
      request: FastifyRequest<{
        Params: { provider: string };
      }>,
      reply: FastifyReply
    ) => {
      const { provider } = request.params;
      const providerEnum = provider.toUpperCase() as Provider;

      if (!Object.values(Provider).includes(providerEnum)) {
        return reply.status(400).send({ error: 'Provider inválido' });
      }

      await prisma.connection.deleteMany({
        where: {
          userId: request.user.userId,
          provider: providerEnum,
        },
      });

      return { success: true, message: `Conexão com ${provider} removida` };
    }
  );
}
