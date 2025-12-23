// ===========================================
// Tela: Inbox de Mensagens
// ===========================================

import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
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

  const { autoReply, fetchSettings } = useSettingsStore();
  const [showExpandedStats, setShowExpandedStats] = useState(false);

  // Animation for auto-reply dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Carrega dados iniciais
  useEffect(() => {
    fetchMessages();
    fetchStats();
    fetchSettings();
  }, []);

  // Pulsing animation for auto-reply dot
  useEffect(() => {
    if (autoReply?.enabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [autoReply?.enabled]);

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

  // Handle bell icon press
  const handleBellPress = useCallback(() => {
    setShowExpandedStats(!showExpandedStats);
  }, [showExpandedStats]);

  // Navigate to message detail
  const handleMessagePress = useCallback((message: Message) => {
    router.push(`/message/${message.id}`);
  }, []);

  // Header component
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Title Row - Wireframe Style */}
      <View style={styles.titleRow}>
        <TouchableOpacity
          style={styles.titleSection}
          onPress={() => setShowExpandedStats(!showExpandedStats)}
          activeOpacity={0.7}
        >
          <Text style={styles.title}>Resumos</Text>
          <Text style={styles.subtitle}>
            {stats?.todayCount || 0} {stats?.todayCount === 1 ? 'mensagem hoje' : 'mensagens hoje'}
          </Text>
        </TouchableOpacity>

        {/* Notification Bell with Badge */}
        <TouchableOpacity
          style={styles.bellButton}
          onPress={handleBellPress}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.gray600} />
          {stats?.unread > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {stats.unread > 9 ? '9+' : stats.unread}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Collapsible Stats - Tap title to expand */}
      {showExpandedStats && (
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
      )}

      {/* Auto-reply Status Banner - Read-only, navigates to settings */}
      <TouchableOpacity
        style={[
          styles.autoReplyBanner,
          autoReply?.enabled && styles.autoReplyBannerActive
        ]}
        onPress={() => router.push('/(tabs)/settings')}
        activeOpacity={0.7}
      >
        <View style={styles.autoReplyLeft}>
          <Animated.View
            style={[
              styles.autoReplyDot,
              autoReply?.enabled && styles.autoReplyDotActive,
              {
                transform: [{ scale: autoReply?.enabled ? pulseAnim : 1 }],
              },
            ]}
          />
          <Text style={[
            styles.autoReplyText,
            autoReply?.enabled && styles.autoReplyTextActive
          ]}>
            Resposta automática {autoReply?.enabled ? 'ativa' : 'inativa'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  bellButton: {
    position: 'relative',
    padding: spacing.xs,
  },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
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
  autoReplyBannerActive: {
    backgroundColor: colors.successBg,
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
    backgroundColor: colors.gray400,
  },
  autoReplyDotActive: {
    backgroundColor: colors.success,
  },
  autoReplyText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  autoReplyTextActive: {
    color: colors.success,
  },
});
