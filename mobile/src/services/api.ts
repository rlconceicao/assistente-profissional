// ===========================================
// Serviço de API - Assistente Profissional
// ===========================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { config } from '../config';
import type {
  User,
  Message,
  MessageDetail,
  MessageStats,
  AutoReplySettings,
  Connection,
  MessageTemplate,
  PaginatedResponse,
  SyncResponse,
  MessageStatus,
  MessageSource,
} from '../types';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token
    this.client.interceptors.request.use(
      async (config) => {
        if (!this.token) {
          this.token = await SecureStore.getItemAsync(config.storage.authToken);
        }
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para tratar erros
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expirado - limpa e redireciona para login
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // ==========================================
  // Token Management
  // ==========================================

  async setToken(token: string): Promise<void> {
    this.token = token;
    await SecureStore.setItemAsync(config.storage.authToken, token);
  }

  async clearToken(): Promise<void> {
    this.token = null;
    await SecureStore.deleteItemAsync(config.storage.authToken);
  }

  async getStoredToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(config.storage.authToken);
  }

  // ==========================================
  // Auth
  // ==========================================

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  async updateProfile(data: {
    name?: string;
    profession?: string;
    phone?: string;
  }): Promise<User> {
    const response = await this.client.patch<User>('/auth/me', data);
    return response.data;
  }

  async disconnectProvider(provider: MessageSource): Promise<void> {
    await this.client.delete(`/auth/connections/${provider.toLowerCase()}`);
  }

  // ==========================================
  // Messages
  // ==========================================

  async syncGmail(): Promise<SyncResponse> {
    const response = await this.client.post<SyncResponse>('/messages/sync/gmail');
    return response.data;
  }

  async getMessages(params?: {
    status?: MessageStatus;
    source?: MessageSource;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Message>> {
    const response = await this.client.get<PaginatedResponse<Message>>('/messages', {
      params,
    });
    return response.data;
  }

  async getMessage(id: string): Promise<MessageDetail> {
    const response = await this.client.get<MessageDetail>(`/messages/${id}`);
    return response.data;
  }

  async markAsRead(id: string): Promise<void> {
    await this.client.patch(`/messages/${id}/read`);
  }

  async sendReply(id: string, content: string): Promise<void> {
    await this.client.post(`/messages/${id}/reply`, { content });
  }

  async getStats(): Promise<MessageStats> {
    const response = await this.client.get<MessageStats>('/messages/stats');
    return response.data;
  }

  // ==========================================
  // Settings
  // ==========================================

  async getAutoReplySettings(): Promise<AutoReplySettings> {
    const response = await this.client.get<AutoReplySettings>('/settings/auto-reply');
    return response.data;
  }

  async updateAutoReplySettings(data: Partial<AutoReplySettings>): Promise<AutoReplySettings> {
    const response = await this.client.patch<{ success: boolean; settings: AutoReplySettings }>(
      '/settings/auto-reply',
      data
    );
    return response.data.settings;
  }

  async toggleAutoReply(): Promise<{ enabled: boolean; message: string }> {
    const response = await this.client.post<{ enabled: boolean; message: string }>(
      '/settings/auto-reply/toggle'
    );
    return response.data;
  }

  async getConnections(): Promise<{
    connections: Connection[];
    availableProviders: { provider: string; connected: boolean }[];
  }> {
    const response = await this.client.get('/settings/connections');
    return response.data;
  }

  async getMessageTemplates(): Promise<MessageTemplate[]> {
    const response = await this.client.get<{ templates: MessageTemplate[] }>(
      '/settings/message-templates'
    );
    return response.data.templates;
  }

  // ==========================================
  // Health Check
  // ==========================================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

// Singleton
export const api = new ApiService();
