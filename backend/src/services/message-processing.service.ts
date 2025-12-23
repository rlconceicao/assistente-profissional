// ===========================================
// Serviço de Processamento de Mensagens
// ===========================================

import { prisma } from '../config/database.js';
import { gmailService, GmailMessage } from './gmail.service.js';
import { aiService } from './ai.service.js';
import { Provider, MessageStatus } from '@prisma/client';
import { config } from '../config/env.js';

export interface ProcessedMessage {
  id: string;
  source: Provider;
  senderName: string;
  senderContact: string;
  subject: string | null;
  summary: string;
  urgency: 'baixa' | 'média' | 'alta';
  actionRequired: string | null;
  isAudio: boolean;
  status: MessageStatus;
  autoReplySent: boolean;
  receivedAt: Date;
}

export class MessageProcessingService {
  /**
   * Sincroniza e-mails novos do Gmail para um usuário
   */
  async syncGmailMessages(userId: string): Promise<ProcessedMessage[]> {
    // Busca a conexão do Gmail do usuário
    const connection = await prisma.connection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: Provider.GMAIL,
        },
      },
      include: {
        user: true,
      },
    });

    if (!connection || !connection.accessToken) {
      throw new Error('Conexão com Gmail não encontrada');
    }

    // Verifica se precisa renovar o token
    let accessToken = connection.accessToken;
    if (connection.expiresAt && connection.expiresAt < new Date()) {
      if (!connection.refreshToken) {
        throw new Error('Token expirado e refresh token não disponível');
      }
      accessToken = await gmailService.refreshAccessToken(connection.refreshToken);

      // Atualiza o token no banco
      await prisma.connection.update({
        where: { id: connection.id },
        data: {
          accessToken,
          expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hora
        },
      });
    }

    // Busca a última mensagem sincronizada
    const lastMessage = await prisma.message.findFirst({
      where: {
        userId,
        source: Provider.GMAIL,
      },
      orderBy: {
        receivedAt: 'desc',
      },
    });

    // Monta query para buscar apenas mensagens novas
    let query = 'is:inbox';
    if (lastMessage) {
      const afterDate = Math.floor(lastMessage.receivedAt.getTime() / 1000);
      query += ` after:${afterDate}`;
    }

    // Busca mensagens do Gmail
    const { messages: gmailMessages } = await gmailService.listMessages(
      accessToken,
      connection.refreshToken || undefined,
      { maxResults: 20, query }
    );

    // Processa cada mensagem
    const processedMessages: ProcessedMessage[] = [];

    for (const gmailMsg of gmailMessages) {
      // Verifica se já existe no banco
      const existing = await prisma.message.findFirst({
        where: {
          userId,
          externalId: gmailMsg.id,
          source: Provider.GMAIL,
        },
      });

      if (existing) continue;

      // Gera resumo com IA
      const summaryResult = await aiService.generateSummary(gmailMsg.body, {
        senderName: gmailMsg.fromName,
        subject: gmailMsg.subject,
        profession: connection.user.profession || undefined,
      });

      // Salva no banco
      const message = await prisma.message.create({
        data: {
          userId,
          connectionId: connection.id,
          externalId: gmailMsg.id,
          source: Provider.GMAIL,
          senderName: gmailMsg.fromName,
          senderContact: gmailMsg.from,
          subject: gmailMsg.subject,
          originalContent: gmailMsg.body,
          summary: summaryResult.summary,
          status: MessageStatus.UNREAD,
          receivedAt: gmailMsg.date,
        },
      });

      // Verifica se deve enviar resposta automática
      const autoReplySettings = await prisma.autoReplySettings.findUnique({
        where: { userId },
      });

      let autoReplySent = false;
      if (autoReplySettings?.enabled && this.isWithinWorkingHours(autoReplySettings)) {
        try {
          await this.sendAutoReply(
            accessToken,
            gmailMsg,
            autoReplySettings.message,
            connection.refreshToken || undefined
          );
          autoReplySent = true;

          // Atualiza mensagem com status de auto-reply
          await prisma.message.update({
            where: { id: message.id },
            data: {
              autoReplySent: true,
              autoReplySentAt: new Date(),
            },
          });

          // Registra a resposta
          await prisma.reply.create({
            data: {
              messageId: message.id,
              userId,
              content: autoReplySettings.message,
              isAutoReply: true,
            },
          });
        } catch (error) {
          console.error('Erro ao enviar resposta automática:', error);
        }
      }

      processedMessages.push({
        id: message.id,
        source: Provider.GMAIL,
        senderName: gmailMsg.fromName,
        senderContact: gmailMsg.from,
        subject: gmailMsg.subject,
        summary: summaryResult.summary,
        urgency: summaryResult.urgency,
        actionRequired: summaryResult.actionRequired,
        isAudio: false,
        status: MessageStatus.UNREAD,
        autoReplySent,
        receivedAt: gmailMsg.date,
      });
    }

    return processedMessages;
  }

  /**
   * Verifica se está dentro do horário de funcionamento
   */
  private isWithinWorkingHours(settings: {
    startTime: string;
    endTime: string;
    activeDays: number[];
  }): boolean {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = domingo
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    // Verifica se é um dia ativo
    if (!settings.activeDays.includes(currentDay)) {
      return false;
    }

    // Verifica se está dentro do horário
    return currentTime >= settings.startTime && currentTime <= settings.endTime;
  }

  /**
   * Envia resposta automática
   */
  private async sendAutoReply(
    accessToken: string,
    originalMessage: GmailMessage,
    replyContent: string,
    refreshToken?: string
  ): Promise<void> {
    const subject = originalMessage.subject.startsWith('Re:')
      ? originalMessage.subject
      : `Re: ${originalMessage.subject}`;

    await gmailService.sendMessage(accessToken, originalMessage.from, subject, replyContent, {
      refreshToken,
      threadId: originalMessage.threadId,
    });
  }

  /**
   * Lista mensagens de um usuário
   */
  async listMessages(
    userId: string,
    options: {
      status?: MessageStatus;
      source?: Provider;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { status, source, limit = 20, offset = 0 } = options;

    const where = {
      userId,
      ...(status && { status }),
      ...(source && { source }),
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          replies: {
            orderBy: { sentAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.message.count({ where }),
    ]);

    return {
      messages,
      total,
      hasMore: offset + messages.length < total,
    };
  }

  /**
   * Obtém detalhes de uma mensagem
   */
  async getMessage(userId: string, messageId: string) {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId,
      },
      include: {
        replies: {
          orderBy: { sentAt: 'asc' },
        },
      },
    });

    if (!message) {
      throw new Error('Mensagem não encontrada');
    }

    return message;
  }

  /**
   * Marca mensagem como lida
   */
  async markAsRead(userId: string, messageId: string) {
    const message = await prisma.message.updateMany({
      where: {
        id: messageId,
        userId,
      },
      data: {
        status: MessageStatus.READ,
      },
    });

    return message;
  }

  /**
   * Envia resposta manual
   */
  async sendReply(userId: string, messageId: string, content: string): Promise<void> {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId,
      },
      include: {
        connection: true,
      },
    });

    if (!message) {
      throw new Error('Mensagem não encontrada');
    }

    if (!message.connection.accessToken) {
      throw new Error('Conexão inválida');
    }

    // Envia e-mail de resposta
    if (message.source === Provider.GMAIL) {
      const subject = message.subject?.startsWith('Re:')
        ? message.subject
        : `Re: ${message.subject || 'Sem assunto'}`;

      await gmailService.sendMessage(
        message.connection.accessToken,
        message.senderContact!,
        subject,
        content,
        {
          refreshToken: message.connection.refreshToken || undefined,
          threadId: message.externalId || undefined,
        }
      );
    }

    // Registra a resposta
    await prisma.reply.create({
      data: {
        messageId,
        userId,
        content,
        isAutoReply: false,
      },
    });

    // Atualiza status da mensagem
    await prisma.message.update({
      where: { id: messageId },
      data: { status: MessageStatus.REPLIED },
    });
  }

  /**
   * Obtém estatísticas do usuário
   */
  async getStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, unread, todayCount, repliedCount] = await Promise.all([
      prisma.message.count({ where: { userId } }),
      prisma.message.count({ where: { userId, status: MessageStatus.UNREAD } }),
      prisma.message.count({
        where: { userId, receivedAt: { gte: today } },
      }),
      prisma.message.count({ where: { userId, status: MessageStatus.REPLIED } }),
    ]);

    return {
      total,
      unread,
      todayCount,
      repliedCount,
      readRate: total > 0 ? ((total - unread) / total) * 100 : 0,
    };
  }
}

// Singleton
export const messageProcessingService = new MessageProcessingService();
