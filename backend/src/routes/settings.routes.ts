// ===========================================
// Rotas de Configurações
// ===========================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/database.js';

// Schemas de validação
const updateAutoReplySchema = z.object({
  enabled: z.boolean().optional(),
  message: z.string().min(10).max(500).optional(),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato inválido. Use HH:MM')
    .optional(),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato inválido. Use HH:MM')
    .optional(),
  activeDays: z
    .array(z.number().min(0).max(6))
    .min(1, 'Selecione pelo menos um dia')
    .optional(),
});

export async function settingsRoutes(app: FastifyInstance) {
  // Todas as rotas requerem autenticação
  app.addHook('preHandler', app.authenticate);

  // ==========================================
  // Obter configurações de resposta automática
  // ==========================================
  app.get('/settings/auto-reply', async (request: FastifyRequest, reply: FastifyReply) => {
    let settings = await prisma.autoReplySettings.findUnique({
      where: { userId: request.user.userId },
    });

    // Se não existir, cria configuração padrão
    if (!settings) {
      settings = await prisma.autoReplySettings.create({
        data: {
          userId: request.user.userId,
          enabled: true,
          message:
            'Recebi sua mensagem! No momento estou em atendimento, mas retorno assim que possível. Obrigado pela compreensão.',
          startTime: '08:00',
          endTime: '18:00',
          activeDays: [1, 2, 3, 4, 5], // Segunda a sexta
        },
      });
    }

    return {
      enabled: settings.enabled,
      message: settings.message,
      startTime: settings.startTime,
      endTime: settings.endTime,
      activeDays: settings.activeDays,
      // Mapa de dias para facilitar no frontend
      activeDaysLabels: settings.activeDays.map((d) =>
        ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]
      ),
    };
  });

  // ==========================================
  // Atualizar configurações de resposta automática
  // ==========================================
  app.patch(
    '/settings/auto-reply',
    async (
      request: FastifyRequest<{
        Body: z.infer<typeof updateAutoReplySchema>;
      }>,
      reply: FastifyReply
    ) => {
      const data = updateAutoReplySchema.parse(request.body);

      // Valida horário
      if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        return reply.status(400).send({
          error: 'Horário inválido',
          message: 'O horário de início deve ser anterior ao horário de término',
        });
      }

      const settings = await prisma.autoReplySettings.upsert({
        where: { userId: request.user.userId },
        update: {
          ...(data.enabled !== undefined && { enabled: data.enabled }),
          ...(data.message && { message: data.message }),
          ...(data.startTime && { startTime: data.startTime }),
          ...(data.endTime && { endTime: data.endTime }),
          ...(data.activeDays && { activeDays: data.activeDays }),
        },
        create: {
          userId: request.user.userId,
          enabled: data.enabled ?? true,
          message:
            data.message ||
            'Recebi sua mensagem! No momento estou em atendimento, mas retorno assim que possível.',
          startTime: data.startTime || '08:00',
          endTime: data.endTime || '18:00',
          activeDays: data.activeDays || [1, 2, 3, 4, 5],
        },
      });

      return {
        success: true,
        settings: {
          enabled: settings.enabled,
          message: settings.message,
          startTime: settings.startTime,
          endTime: settings.endTime,
          activeDays: settings.activeDays,
        },
      };
    }
  );

  // ==========================================
  // Toggle rápido de resposta automática
  // ==========================================
  app.post(
    '/settings/auto-reply/toggle',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const current = await prisma.autoReplySettings.findUnique({
        where: { userId: request.user.userId },
      });

      const settings = await prisma.autoReplySettings.upsert({
        where: { userId: request.user.userId },
        update: {
          enabled: !current?.enabled,
        },
        create: {
          userId: request.user.userId,
          enabled: true,
          message:
            'Recebi sua mensagem! No momento estou em atendimento, mas retorno assim que possível.',
        },
      });

      return {
        enabled: settings.enabled,
        message: settings.enabled
          ? 'Resposta automática ativada'
          : 'Resposta automática desativada',
      };
    }
  );

  // ==========================================
  // Listar conexões ativas
  // ==========================================
  app.get('/settings/connections', async (request: FastifyRequest, reply: FastifyReply) => {
    const connections = await prisma.connection.findMany({
      where: { userId: request.user.userId },
      select: {
        id: true,
        provider: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return {
      connections: connections.map((conn) => ({
        id: conn.id,
        provider: conn.provider,
        connected: true,
        connectedAt: conn.createdAt,
        isExpired: conn.expiresAt ? conn.expiresAt < new Date() : false,
      })),
      availableProviders: ['GMAIL', 'OUTLOOK', 'WHATSAPP'].map((provider) => ({
        provider,
        connected: connections.some((c) => c.provider === provider),
      })),
    };
  });

  // ==========================================
  // Mensagens pré-definidas (templates)
  // ==========================================
  app.get(
    '/settings/message-templates',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Templates padrão (pode ser expandido para salvar no banco)
      return {
        templates: [
          {
            id: 'default',
            name: 'Padrão',
            message:
              'Recebi sua mensagem! No momento estou em atendimento, mas retorno assim que possível. Obrigado pela compreensão.',
          },
          {
            id: 'meeting',
            name: 'Em reunião',
            message:
              'Olá! Estou em uma reunião no momento. Assim que possível, entrarei em contato. Obrigado!',
          },
          {
            id: 'lunch',
            name: 'Horário de almoço',
            message:
              'Estou no horário de almoço (12h às 14h). Retorno assim que voltar. Obrigado pela compreensão!',
          },
          {
            id: 'vacation',
            name: 'Férias',
            message:
              'Estou em período de férias até [DATA]. Para assuntos urgentes, entre em contato com [CONTATO]. Obrigado!',
          },
          {
            id: 'medical',
            name: 'Médico - Em consulta',
            message:
              'Estou em atendimento no momento. Analisarei sua mensagem assim que possível. Em caso de urgência, procure o pronto-socorro mais próximo.',
          },
          {
            id: 'lawyer',
            name: 'Advogado - Em audiência',
            message:
              'Estou em audiência no momento. Retornarei seu contato assim que possível. Obrigado pela compreensão.',
          },
        ],
      };
    }
  );
}
