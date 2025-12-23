// ===========================================
// Rotas de Mensagens
// ===========================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { messageProcessingService } from '../services/message-processing.service.js';
import { MessageStatus, Provider } from '@prisma/client';

// Schemas de validação
const listMessagesSchema = z.object({
  status: z.enum(['UNREAD', 'READ', 'REPLIED', 'ARCHIVED']).optional(),
  source: z.enum(['GMAIL', 'OUTLOOK', 'WHATSAPP']).optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const sendReplySchema = z.object({
  content: z.string().min(1).max(5000),
});

export async function messageRoutes(app: FastifyInstance) {
  // Todas as rotas requerem autenticação
  app.addHook('preHandler', app.authenticate);

  // ==========================================
  // Sincronizar e-mails do Gmail
  // ==========================================
  app.post('/messages/sync/gmail', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const newMessages = await messageProcessingService.syncGmailMessages(
        request.user.userId
      );

      return {
        success: true,
        count: newMessages.length,
        messages: newMessages,
      };
    } catch (error) {
      console.error('Erro ao sincronizar Gmail:', error);
      return reply.status(500).send({
        error: 'Erro ao sincronizar e-mails',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  });

  // ==========================================
  // Listar mensagens
  // ==========================================
  app.get(
    '/messages',
    async (
      request: FastifyRequest<{
        Querystring: z.infer<typeof listMessagesSchema>;
      }>,
      reply: FastifyReply
    ) => {
      const params = listMessagesSchema.parse(request.query);

      const result = await messageProcessingService.listMessages(request.user.userId, {
        status: params.status as MessageStatus | undefined,
        source: params.source as Provider | undefined,
        limit: params.limit,
        offset: params.offset,
      });

      return {
        messages: result.messages.map((msg) => ({
          id: msg.id,
          source: msg.source,
          senderName: msg.senderName,
          senderContact: msg.senderContact,
          subject: msg.subject,
          summary: msg.summary,
          isAudio: msg.isAudio,
          audioDurationSecs: msg.audioDurationSecs,
          status: msg.status,
          autoReplySent: msg.autoReplySent,
          autoReplySentAt: msg.autoReplySentAt,
          receivedAt: msg.receivedAt,
          hasReplies: msg.replies.length > 0,
          lastReplyAt: msg.replies[0]?.sentAt || null,
        })),
        total: result.total,
        hasMore: result.hasMore,
      };
    }
  );

  // ==========================================
  // Obter detalhes de uma mensagem
  // ==========================================
  app.get(
    '/messages/:id',
    async (
      request: FastifyRequest<{
        Params: { id: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const message = await messageProcessingService.getMessage(
          request.user.userId,
          request.params.id
        );

        // Marca como lida automaticamente
        if (message.status === MessageStatus.UNREAD) {
          await messageProcessingService.markAsRead(request.user.userId, message.id);
        }

        return {
          id: message.id,
          source: message.source,
          senderName: message.senderName,
          senderContact: message.senderContact,
          subject: message.subject,
          originalContent: message.originalContent,
          transcription: message.transcription,
          summary: message.summary,
          isAudio: message.isAudio,
          audioDurationSecs: message.audioDurationSecs,
          audioUrl: message.audioUrl,
          status: message.status === MessageStatus.UNREAD ? MessageStatus.READ : message.status,
          autoReplySent: message.autoReplySent,
          autoReplySentAt: message.autoReplySentAt,
          receivedAt: message.receivedAt,
          replies: message.replies.map((r) => ({
            id: r.id,
            content: r.content,
            isAutoReply: r.isAutoReply,
            sentAt: r.sentAt,
          })),
        };
      } catch (error) {
        return reply.status(404).send({
          error: 'Mensagem não encontrada',
        });
      }
    }
  );

  // ==========================================
  // Marcar mensagem como lida
  // ==========================================
  app.patch(
    '/messages/:id/read',
    async (
      request: FastifyRequest<{
        Params: { id: string };
      }>,
      reply: FastifyReply
    ) => {
      await messageProcessingService.markAsRead(request.user.userId, request.params.id);

      return { success: true };
    }
  );

  // ==========================================
  // Enviar resposta
  // ==========================================
  app.post(
    '/messages/:id/reply',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: z.infer<typeof sendReplySchema>;
      }>,
      reply: FastifyReply
    ) => {
      const { content } = sendReplySchema.parse(request.body);

      try {
        await messageProcessingService.sendReply(
          request.user.userId,
          request.params.id,
          content
        );

        return {
          success: true,
          message: 'Resposta enviada com sucesso',
        };
      } catch (error) {
        console.error('Erro ao enviar resposta:', error);
        return reply.status(500).send({
          error: 'Erro ao enviar resposta',
          message: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }
  );

  // ==========================================
  // Obter estatísticas
  // ==========================================
  app.get('/messages/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const stats = await messageProcessingService.getStats(request.user.userId);
    return stats;
  });
}
