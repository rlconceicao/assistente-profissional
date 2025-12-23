// ===========================================
// Tela: Detalhes da Mensagem
// ===========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { useMessagesStore, useSettingsStore } from '../../src/stores';
import { Avatar, SourceIcon, Card, Loading, Button } from '../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../../src/theme';
import type { MessageDetail } from '../../src/types';

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const markAsRead = useMessagesStore((s) => s.markAsRead);
  const autoReply = useSettingsStore((s) => s.autoReply);

  useEffect(() => {
    loadMessage();
  }, [id]);

  const loadMessage = async () => {
    try {
      const data = await api.getMessage(id);
      setMessage(data);
      markAsRead(id);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar a mensagem.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Atenção', 'Digite uma mensagem para enviar.');
      return;
    }

    setIsSending(true);
    try {
      await api.sendReply(id, replyText.trim());
      Alert.alert('Enviado!', 'Sua resposta foi enviada com sucesso.');
      setReplyText('');
      loadMessage(); // Recarrega para mostrar a resposta
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar a resposta.');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <Loading message="Carregando mensagem..." />;
  }

  if (!message) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: message.senderName,
          headerBackTitle: 'Voltar',
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Avatar name={message.senderName} source={message.source} size="lg" />
            <View style={styles.headerInfo}>
              <Text style={styles.senderName}>{message.senderName}</Text>
              <View style={styles.headerMeta}>
                <SourceIcon source={message.source} size={14} />
                <Text style={styles.metaText}>
                  {message.source === 'GMAIL' ? 'E-mail' : message.source}
                </Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{formatDate(message.receivedAt)}</Text>
              </View>
            </View>
          </View>

          {/* Subject (if email) */}
          {message.subject && (
            <Text style={styles.subject}>{message.subject}</Text>
          )}

          {/* Summary Card */}
          <Card style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Text style={styles.cardEmoji}>✨</Text>
              </View>
              <Text style={styles.cardTitle}>Resumo</Text>
            </View>
            <Text style={styles.summaryText}>{message.summary}</Text>
          </Card>

          {/* Original Content Card */}
          <Card style={styles.originalCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: colors.gray100 }]}>
                <Ionicons
                  name={message.isAudio ? 'mic' : 'document-text'}
                  size={18}
                  color={colors.gray600}
                />
              </View>
              <Text style={styles.cardTitle}>
                {message.isAudio ? 'Transcrição do áudio' : 'Mensagem original'}
              </Text>
            </View>

            {/* Audio Player (if audio) */}
            {message.isAudio && message.audioDurationSecs && (
              <View style={styles.audioPlayer}>
                <TouchableOpacity style={styles.playButtonEnhanced}>
                  <Ionicons name="volume-high-outline" size={20} color={colors.white} />
                </TouchableOpacity>
                <View style={styles.audioProgress}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '30%' }]} />
                  </View>
                  <View style={styles.audioTime}>
                    <Text style={styles.timeText}>0:00</Text>
                    <Text style={styles.timeText}>
                      {formatDuration(message.audioDurationSecs)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Content Text */}
            {message.isAudio && message.transcription ? (
              <Text style={styles.transcriptionText}>
                "{message.transcription}"
              </Text>
            ) : (
              <Text style={styles.originalText}>
                {message.originalContent || 'Conteúdo não disponível'}
              </Text>
            )}
          </Card>

          {/* Auto-reply confirmation */}
          {message.autoReplySent && message.autoReplySentAt && (
            <View style={styles.autoReplyBoxEnhanced}>
              <View style={styles.autoReplyHeader}>
                <Ionicons name="checkmark-done" size={18} color={colors.success} />
                <Text style={styles.autoReplyText}>
                  Resposta automática enviada às{' '}
                  {new Date(message.autoReplySentAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {/* Show the actual message sent */}
              {autoReply?.message && (
                <Text style={styles.autoReplyPreview}>
                  "{autoReply.message}"
                </Text>
              )}
            </View>
          )}

          {/* Replies */}
          {message.replies.length > 0 && (
            <View style={styles.repliesSection}>
              <Text style={styles.repliesTitle}>Respostas</Text>
              {message.replies.map((reply) => (
                <Card key={reply.id} style={styles.replyCard}>
                  <View style={styles.replyHeader}>
                    <Ionicons
                      name={reply.isAutoReply ? 'flash' : 'person'}
                      size={14}
                      color={reply.isAutoReply ? colors.warning : colors.primary}
                    />
                    <Text style={styles.replyType}>
                      {reply.isAutoReply ? 'Resposta automática' : 'Você'}
                    </Text>
                    <Text style={styles.replyTime}>
                      {formatDate(reply.sentAt)}
                    </Text>
                  </View>
                  <Text style={styles.replyContent}>{reply.content}</Text>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Reply Input */}
        <View style={styles.replyBar}>
          <TextInput
            style={styles.replyInput}
            placeholder="Digite sua resposta..."
            placeholderTextColor={colors.gray400}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !replyText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendReply}
            disabled={!replyText.trim() || isSending}
          >
            {isSending ? (
              <Ionicons name="hourglass" size={20} color={colors.white} />
            ) : (
              <Ionicons name="send" size={20} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  metaDot: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  subject: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  originalCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  summaryText: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    lineHeight: fontSize.base * 1.6,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonEnhanced: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  audioProgress: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  audioTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  timeText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  originalText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.6,
  },
  transcriptionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: fontSize.sm * 1.6,
  },
  autoReplyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  autoReplyBoxEnhanced: {
    backgroundColor: colors.successBg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.success + '20',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  autoReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  autoReplyText: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: fontWeight.medium,
  },
  autoReplyPreview: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontStyle: 'italic',
    lineHeight: fontSize.sm * 1.5,
    marginTop: spacing.sm,
  },
  repliesSection: {
    marginTop: spacing.md,
  },
  repliesTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  replyCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  replyType: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  replyTime: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginLeft: 'auto',
  },
  replyContent: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: fontSize.sm * 1.5,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  replyInput: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    maxHeight: 120,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
});
