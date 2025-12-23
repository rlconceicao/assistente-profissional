// ===========================================
// Store Global - Zustand
// ===========================================

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { config } from '../config';
import { api } from '../services/api';
import type { User, Message, MessageStats, AutoReplySettings } from '../types';

// ==========================================
// Auth Store
// ==========================================
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (token) => {
    await api.setToken(token);
    try {
      const user = await api.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      await api.clearToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await api.clearToken();
    await SecureStore.deleteItemAsync(config.storage.user);
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await api.getStoredToken();
      if (!token) {
        set({ isLoading: false });
        return false;
      }
      
      const user = await api.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      await api.clearToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  },

  updateProfile: async (data) => {
    const user = await api.updateProfile(data);
    set({ user });
  },
}));

// ==========================================
// Messages Store
// ==========================================
interface MessagesState {
  messages: Message[];
  stats: MessageStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isSyncing: boolean;
  hasMore: boolean;
  
  // Actions
  fetchMessages: (refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  syncGmail: () => Promise<number>;
  markAsRead: (id: string) => void;
  fetchStats: () => Promise<void>;
  reset: () => void;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: [],
  stats: null,
  isLoading: false,
  isRefreshing: false,
  isSyncing: false,
  hasMore: true,

  fetchMessages: async (refresh = false) => {
    const state = get();
    if (state.isLoading && !refresh) return;

    set({ isLoading: !refresh, isRefreshing: refresh });

    try {
      const response = await api.getMessages({ limit: 20, offset: 0 });
      set({
        messages: response.messages,
        hasMore: response.hasMore,
        isLoading: false,
        isRefreshing: false,
      });
    } catch (error) {
      set({ isLoading: false, isRefreshing: false });
      throw error;
    }
  },

  loadMore: async () => {
    const state = get();
    if (state.isLoading || !state.hasMore) return;

    set({ isLoading: true });

    try {
      const response = await api.getMessages({
        limit: 20,
        offset: state.messages.length,
      });
      set({
        messages: [...state.messages, ...response.messages],
        hasMore: response.hasMore,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  syncGmail: async () => {
    set({ isSyncing: true });
    try {
      const response = await api.syncGmail();
      
      if (response.count > 0) {
        // Recarrega a lista de mensagens
        await get().fetchMessages(true);
      }
      
      set({ isSyncing: false });
      return response.count;
    } catch (error) {
      set({ isSyncing: false });
      throw error;
    }
  },

  markAsRead: (id) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, status: 'READ' as const } : msg
      ),
    }));
    // Fire and forget
    api.markAsRead(id).catch(console.error);
  },

  fetchStats: async () => {
    try {
      const stats = await api.getStats();
      set({ stats });
    } catch (error) {
      console.error('Erro ao buscar stats:', error);
    }
  },

  reset: () => {
    set({
      messages: [],
      stats: null,
      isLoading: false,
      isRefreshing: false,
      isSyncing: false,
      hasMore: true,
    });
  },
}));

// ==========================================
// Settings Store
// ==========================================
interface SettingsState {
  autoReply: AutoReplySettings | null;
  isLoading: boolean;
  
  // Actions
  fetchSettings: () => Promise<void>;
  updateAutoReply: (data: Partial<AutoReplySettings>) => Promise<void>;
  toggleAutoReply: () => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  autoReply: null,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const autoReply = await api.getAutoReplySettings();
      set({ autoReply, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateAutoReply: async (data) => {
    try {
      const autoReply = await api.updateAutoReplySettings(data);
      set({ autoReply });
    } catch (error) {
      throw error;
    }
  },

  toggleAutoReply: async () => {
    const response = await api.toggleAutoReply();
    set((state) => ({
      autoReply: state.autoReply
        ? { ...state.autoReply, enabled: response.enabled }
        : null,
    }));
    return response.enabled;
  },
}));
