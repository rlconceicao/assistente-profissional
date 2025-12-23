// ===========================================
// Componente: Item de Mensagem
// ===========================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, SourceIcon, StatusIndicator, Badge } from './ui';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  onPress: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onPress }) => {
  const isUnread = message.status === 'UNREAD';

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={[styles.container, isUnread && styles.containerUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <Avatar name={message.senderName} source={message.source} />

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.senderInfo}>
            <Text style={[styles.senderName, isUnread && styles.textBold]} numberOfLines={1}>
              {message.senderName}
            </Text>
            <SourceIcon source={message.source} size={14} />
            {message.isAudio && (
              <View style={styles.audioBadge}>
                <Ionicons name="mic" size={10} color={colors.warning} />
                <Text style={styles.audioDuration}>
                  {message.audioDurationSecs ? formatDuration(message.audioDurationSecs) : ''}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.time}>{formatTime(message.receivedAt)}</Text>
            <StatusIndicator status={message.status} />
          </View>
        </View>

        {/* Subject (if email) */}
        {message.subject && (
          <Text style={[styles.subject, isUnread && styles.textBold]} numberOfLines={1}>
            {message.subject}
          </Text>
        )}

        {/* Summary */}
        <Text style={styles.summary} numberOfLines={2}>
          {message.summary}
        </Text>

        {/* Auto-reply indicator */}
        {message.autoReplySent && isUnread && (
          <View style={styles.autoReplyBadge}>
            <Ionicons name="checkmark" size={12} color={colors.success} />
            <Text style={styles.autoReplyText}>Resposta automática enviada</Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: spacing.md,
  },
  containerUnread: {
    backgroundColor: colors.primaryBg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  senderName: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    maxWidth: '60%',
  },
  textBold: {
    fontWeight: fontWeight.semibold,
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.warningBg,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  audioDuration: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: fontWeight.medium,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  subject: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summary: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.4,
  },
  autoReplyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  autoReplyText: {
    fontSize: fontSize.xs,
    color: colors.success,
  },
});
