// ===========================================
// Tela: Inbox de Mensagens
// ===========================================

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMessagesStore, useSettingsStore } from '../../src/stores';
import { MessageItem } from '../../src/components/MessageItem';
import { EmptyState, Loading } from '../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';
import type { Message } from '../../src/types';

export default function InboxScreen() {
  const {
    messages,
    stats,
    isLoading,
    isRefreshing,
    isSyncing,
    hasMore,
    fetchMessages,
    loadMore,
    syncGmail,
    fetchStats,
  } = useMessagesStore();

  const { autoReply, fetchSettings, toggleAutoReply } = useSettingsStore();

  // Carrega dados iniciais
  useEffect(() => {
    fetchMessages();
    fetchStats();
    fetchSettings();
  }, []);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await fetchMessages(true);
    await fetchStats();
  }, []);

  // Sync Gmail
  const handleSync = useCallback(async () => {
    try {
      const count = await syncGmail();
      if (count > 0) {
        Alert.alert('Sincronizado!', `${count} nova(s) mensagem(ns) recebida(s).`);
      } else {
        Alert.alert('Atualizado', 'Nenhuma mensagem nova.');
      }
      await fetchStats();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível sincronizar. Tente novamente.');
    }
  }, []);

  // Toggle auto-reply
  const handleToggleAutoReply = useCallback(async () => {
    try {
      const enabled = await toggleAutoReply();
      Alert.alert(
        enabled ? 'Ativado' : 'Desativado',
        enabled
          ? 'Resposta automática ativada.'
          : 'Resposta automática desativada.'
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar a configuração.');
    }
  }, []);

  // Navigate to message detail
  const handleMessagePress = useCallback((message: Message) => {
    router.push(`/message/${message.id}`);
  }, []);

  // Header component
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.todayCount || 0}</Text>
          <Text style={styles.statLabel}>Hoje</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, stats?.unread ? styles.statHighlight : null]}>
            {stats?.unread || 0}
          </Text>
          <Text style={styles.statLabel}>Não lidas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.repliedCount || 0}</Text>
          <Text style={styles.statLabel}>Respondidas</Text>
        </View>
      </View>

      {/* Auto-reply status */}
      <TouchableOpacity style={styles.autoReplyBanner} onPress={handleToggleAutoReply}>
        <View style={styles.autoReplyLeft}>
          <View
            style={[
              styles.autoReplyDot,
              { backgroundColor: autoReply?.enabled ? colors.success : colors.gray400 },
            ]}
          />
          <Text style={styles.autoReplyText}>
            Resposta automática {autoReply?.enabled ? 'ativa' : 'inativa'}
          </Text>
        </View>
        <Ionicons
          name={autoReply?.enabled ? 'toggle' : 'toggle-outline'}
          size={24}
          color={autoReply?.enabled ? colors.success : colors.gray400}
        />
      </TouchableOpacity>

      {/* Sync button */}
      <TouchableOpacity
        style={styles.syncButton}
        onPress={handleSync}
        disabled={isSyncing}
      >
        <Ionicons
          name="sync"
          size={20}
          color={colors.primary}
          style={isSyncing ? styles.spinning : null}
        />
        <Text style={styles.syncText}>
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Gmail'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (isLoading && messages.length === 0) {
    return <Loading message="Carregando mensagens..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageItem message={item} onPress={() => handleMessagePress(item)} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="mail-outline"
            title="Nenhuma mensagem"
            description="Suas mensagens aparecerão aqui. Sincronize com o Gmail para começar."
            action={{ label: 'Sincronizar Gmail', onPress: handleSync }}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        contentContainerStyle={messages.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  statHighlight: {
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray200,
  },
  autoReplyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  autoReplyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  autoReplyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  autoReplyText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  syncText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  spinning: {
    // TODO: Add rotation animation
  },
});
