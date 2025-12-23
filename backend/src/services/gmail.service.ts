// ===========================================
// Serviço de Integração com Gmail
// ===========================================

import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/env.js';
import { prisma } from '../config/database.js';
import { Provider } from '@prisma/client';

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  subject: string;
  body: string;
  date: Date;
  snippet: string;
}

export class GmailService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
  }

  // ==========================================
  // Autenticação OAuth
  // ==========================================

  /**
   * Gera URL para autenticação OAuth do usuário
   */
  getAuthUrl(state?: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: config.google.scopes,
      prompt: 'consent', // Força a exibição do consentimento para obter refresh_token
      state,
    });
  }

  /**
   * Troca o código de autorização por tokens de acesso
   */
  async exchangeCodeForTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Configura o cliente com tokens existentes
   */
  setCredentials(accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  /**
   * Atualiza o token de acesso se necessário
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials.access_token!;
  }

  /**
   * Obtém informações do perfil do usuário
   */
  async getUserProfile(accessToken: string) {
    this.setCredentials(accessToken);

    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();

    return {
      email: data.email!,
      name: data.name || data.email!,
      picture: data.picture,
    };
  }

  // ==========================================
  // Operações com E-mails
  // ==========================================

  /**
   * Obtém cliente Gmail autenticado
   */
  private getGmailClient(): gmail_v1.Gmail {
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Lista mensagens recentes da caixa de entrada
   */
  async listMessages(
    accessToken: string,
    refreshToken?: string,
    options: {
      maxResults?: number;
      query?: string;
      pageToken?: string;
    } = {}
  ): Promise<{ messages: GmailMessage[]; nextPageToken?: string }> {
    this.setCredentials(accessToken, refreshToken);
    const gmail = this.getGmailClient();

    const { maxResults = 10, query = 'is:inbox', pageToken } = options;

    // Lista IDs das mensagens
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query,
      pageToken,
    });

    if (!listResponse.data.messages) {
      return { messages: [] };
    }

    // Busca detalhes de cada mensagem
    const messages = await Promise.all(
      listResponse.data.messages.map((msg) =>
        this.getMessage(accessToken, msg.id!, refreshToken)
      )
    );

    return {
      messages: messages.filter((m): m is GmailMessage => m !== null),
      nextPageToken: listResponse.data.nextPageToken || undefined,
    };
  }

  /**
   * Obtém uma mensagem específica pelo ID
   */
  async getMessage(
    accessToken: string,
    messageId: string,
    refreshToken?: string
  ): Promise<GmailMessage | null> {
    this.setCredentials(accessToken, refreshToken);
    const gmail = this.getGmailClient();

    try {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data;
      const headers = message.payload?.headers || [];

      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      // Extrai o corpo da mensagem
      const body = this.extractMessageBody(message.payload);

      // Parse do endereço "From"
      const fromHeader = getHeader('From');
      const fromMatch = fromHeader.match(/^(?:"?(.+?)"?\s*)?<?([^>]+@[^>]+)>?$/);
      const fromName = fromMatch?.[1] || fromMatch?.[2] || fromHeader;
      const fromEmail = fromMatch?.[2] || fromHeader;

      return {
        id: message.id!,
        threadId: message.threadId!,
        from: fromEmail,
        fromName,
        subject: getHeader('Subject'),
        body,
        date: new Date(parseInt(message.internalDate!)),
        snippet: message.snippet || '',
      };
    } catch (error) {
      console.error(`Erro ao obter mensagem ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Extrai o corpo de texto da mensagem
   */
  private extractMessageBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
    if (!payload) return '';

    // Se tem corpo direto
    if (payload.body?.data) {
      return this.decodeBase64(payload.body.data);
    }

    // Se tem partes (multipart)
    if (payload.parts) {
      // Prefere text/plain, mas aceita text/html
      const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
      const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
      const part = textPart || htmlPart;

      if (part?.body?.data) {
        let body = this.decodeBase64(part.body.data);

        // Se for HTML, remove tags (simplificado)
        if (part.mimeType === 'text/html') {
          body = body
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }

        return body;
      }

      // Busca recursivamente em partes aninhadas
      for (const part of payload.parts) {
        const body = this.extractMessageBody(part);
        if (body) return body;
      }
    }

    return '';
  }

  /**
   * Decodifica string Base64 URL-safe
   */
  private decodeBase64(data: string): string {
    const buffer = Buffer.from(data, 'base64url');
    return buffer.toString('utf-8');
  }

  /**
   * Envia uma mensagem de e-mail
   */
  async sendMessage(
    accessToken: string,
    to: string,
    subject: string,
    body: string,
    options: {
      refreshToken?: string;
      threadId?: string;
      inReplyTo?: string;
    } = {}
  ): Promise<string> {
    this.setCredentials(accessToken, options.refreshToken);
    const gmail = this.getGmailClient();

    // Monta o e-mail no formato RFC 2822
    const messageParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
    ];

    if (options.inReplyTo) {
      messageParts.push(`In-Reply-To: ${options.inReplyTo}`);
      messageParts.push(`References: ${options.inReplyTo}`);
    }

    messageParts.push('', body);

    const rawMessage = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(rawMessage).toString('base64url');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: options.threadId,
      },
    });

    return response.data.id!;
  }

  /**
   * Marca uma mensagem como lida
   */
  async markAsRead(accessToken: string, messageId: string, refreshToken?: string): Promise<void> {
    this.setCredentials(accessToken, refreshToken);
    const gmail = this.getGmailClient();

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  }

  /**
   * Obtém lista de labels
   */
  async listLabels(accessToken: string, refreshToken?: string) {
    this.setCredentials(accessToken, refreshToken);
    const gmail = this.getGmailClient();

    const response = await gmail.users.labels.list({
      userId: 'me',
    });

    return response.data.labels || [];
  }
}

// Singleton
export const gmailService = new GmailService();
