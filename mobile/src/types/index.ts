// ===========================================
// Tipos TypeScript - Assistente Profissional
// ===========================================

// ==========================================
// Usuário
// ==========================================
export interface User {
  id: string;
  email: string;
  name: string;
  profession?: string;
  phone?: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
}

// ==========================================
// Mensagens
// ==========================================
export type MessageStatus = 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';
export type MessageSource = 'GMAIL' | 'OUTLOOK' | 'WHATSAPP';
export type Urgency = 'baixa' | 'média' | 'alta';

export interface Message {
  id: string;
  source: MessageSource;
  senderName: string;
  senderContact: string;
  subject?: string;
  summary: string;
  isAudio: boolean;
  audioDurationSecs?: number;
  status: MessageStatus;
  autoReplySent: boolean;
  autoReplySentAt?: string;
  receivedAt: string;
  hasReplies: boolean;
  lastReplyAt?: string;
}

export interface MessageDetail extends Message {
  originalContent?: string;
  transcription?: string;
  audioUrl?: string;
  replies: Reply[];
}

export interface Reply {
  id: string;
  content: string;
  isAutoReply: boolean;
  sentAt: string;
}

// ==========================================
// Configurações
// ==========================================
export interface AutoReplySettings {
  enabled: boolean;
  message: string;
  startTime: string;
  endTime: string;
  activeDays: number[];
  activeDaysLabels: string[];
}

export interface Connection {
  id: string;
  provider: MessageSource;
  connected: boolean;
  connectedAt: string;
  isExpired: boolean;
}

export interface MessageTemplate {
  id: string;
  name: string;
  message: string;
}

// ==========================================
// Estatísticas
// ==========================================
export interface MessageStats {
  total: number;
  unread: number;
  todayCount: number;
  repliedCount: number;
  readRate: number;
}

// ==========================================
// API Responses
// ==========================================
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  messages: T[];
  total: number;
  hasMore: boolean;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface SyncResponse {
  success: boolean;
  count: number;
  messages: Message[];
}
