// ===========================================
// Tela: Configurações
// ===========================================

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useSettingsStore } from '../../src/stores';
import { Card, Avatar, Button } from '../../src/components/ui';
import { api } from '../../src/services/api';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../../src/theme';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { autoReply, fetchSettings, updateAutoReply } = useSettingsStore();

  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [connections, setConnections] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Animation for toggle switch
  const toggleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchSettings();
    loadConnections();
  }, []);

  useEffect(() => {
    if (autoReply) {
      setMessage(autoReply.message);
    }
  }, [autoReply]);

  // Animate toggle switch
  useEffect(() => {
    Animated.spring(toggleAnim, {
      toValue: autoReply?.enabled ? 1 : 0,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [autoReply?.enabled]);

  const loadConnections = async () => {
    try {
      const data = await api.getConnections();
      setConnections(data.connections);
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
    }
  };

  const handleToggleEnabled = async (value: boolean) => {
    try {
      await updateAutoReply({ enabled: value });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a configuração.');
    }
  };

  const handleSaveMessage = async () => {
    if (message.length < 10) {
      Alert.alert('Erro', 'A mensagem deve ter pelo menos 10 caracteres.');
      return;
    }

    try {
      await updateAutoReply({ message });
      setIsEditing(false);
      Alert.alert('Sucesso', 'Mensagem atualizada!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a mensagem.');
    }
  };

  const handleToggleDay = async (day: number) => {
    if (!autoReply) return;

    const newDays = autoReply.activeDays.includes(day)
      ? autoReply.activeDays.filter((d) => d !== day)
      : [...autoReply.activeDays, day].sort();

    if (newDays.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um dia.');
      return;
    }

    try {
      await updateAutoReply({ activeDays: newDays });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar os dias.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar name={user?.name || 'U'} size="lg" />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {user?.profession && (
              <Text style={styles.profileProfession}>{user.profession}</Text>
            )}
          </View>
        </View>
      </Card>

      {/* Auto-Reply Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resposta Automática</Text>

        <Card>
          {/* Enable/Disable with Custom Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.success} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Ativar resposta automática</Text>
                <Text style={styles.settingDescription}>
                  Envia confirmação ao receber mensagens
                </Text>
              </View>
            </View>

            {/* Custom Toggle - Wireframe Style */}
            <TouchableOpacity
              style={[
                styles.toggleContainer,
                autoReply?.enabled && styles.toggleContainerActive
              ]}
              onPress={() => handleToggleEnabled(!autoReply?.enabled)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.toggleThumb,
                  {
                    transform: [{
                      translateX: toggleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [2, 22],
                      }),
                    }],
                  },
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Message Section - Simplified */}
          <View style={styles.messageSection}>
            <View style={styles.messageLabelRow}>
              <Text style={styles.messageLabel}>Mensagem automática:</Text>
              {!isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Ionicons name="pencil" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {isEditing ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.messageInput}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={500}
                  placeholder="Digite sua mensagem automática..."
                  placeholderTextColor={colors.gray400}
                />
                <Text style={styles.charCount}>{message.length}/500</Text>
                <Button title="Salvar" onPress={handleSaveMessage} size="sm" />
              </View>
            ) : (
              <View style={styles.messageDisplay}>
                <Text style={styles.messagePreview}>
                  "{autoReply?.message || 'Nenhuma mensagem configurada'}"
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Working Hours - Wireframe Style */}
          <View style={styles.hoursSection}>
            <Text style={styles.hoursLabel}>Horário de funcionamento:</Text>
            <View style={styles.hoursRow}>
              <View style={styles.hourBox}>
                <Ionicons name="time-outline" size={16} color={colors.gray400} />
                <Text style={styles.hourText}>{autoReply?.startTime || '08:00'}</Text>
              </View>
              <Text style={styles.hourSeparator}>até</Text>
              <View style={styles.hourBox}>
                <Ionicons name="time-outline" size={16} color={colors.gray400} />
                <Text style={styles.hourText}>{autoReply?.endTime || '18:00'}</Text>
              </View>
            </View>
          </View>

          {/* Advanced Settings Toggle */}
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
            activeOpacity={0.7}
          >
            <Text style={styles.advancedText}>Configurações avançadas</Text>
            <Ionicons
              name={showAdvanced ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.gray400}
            />
          </TouchableOpacity>

          {/* Collapsible Advanced Section */}
          {showAdvanced && (
            <>
              <View style={styles.divider} />

              {/* Active Days - Keep existing implementation */}
              <View style={styles.daysSection}>
                <Text style={styles.daysLabel}>Dias ativos</Text>
                <View style={styles.daysRow}>
                  {DAYS_OF_WEEK.map((day, index) => {
                    const isActive = autoReply?.activeDays?.includes(index);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.dayChip, isActive && styles.dayChipActive]}
                        onPress={() => handleToggleDay(index)}
                      >
                        <Text style={[styles.dayText, isActive && styles.dayTextActive]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </Card>
      </View>

      {/* Connections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conexões</Text>

        <Card>
          {/* Gmail */}
          <TouchableOpacity style={styles.connectionRow}>
            <View style={styles.connectionInfo}>
              <View style={[styles.connectionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="mail" size={20} color={colors.gmail} />
              </View>
              <View>
                <Text style={styles.connectionName}>Gmail</Text>
                <Text style={styles.connectionStatus}>
                  {connections.some((c) => c.provider === 'GMAIL')
                    ? 'Conectado'
                    : 'Não conectado'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* WhatsApp */}
          <TouchableOpacity style={styles.connectionRow}>
            <View style={styles.connectionInfo}>
              <View style={[styles.connectionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="logo-whatsapp" size={20} color={colors.whatsapp} />
              </View>
              <View>
                <Text style={styles.connectionName}>WhatsApp Business</Text>
                <Text style={styles.connectionStatus}>Em breve</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Other Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outros</Text>

        <Card>
          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuInfo}>
              <Ionicons name="person-outline" size={20} color={colors.gray500} />
              <Text style={styles.menuText}>Minha conta</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuInfo}>
              <Ionicons name="card-outline" size={20} color={colors.gray500} />
              <Text style={styles.menuText}>Assinatura</Text>
            </View>
            <Text style={styles.planBadge}>{user?.plan || 'FREE'}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuInfo}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.gray500} />
              <Text style={styles.menuText}>Privacidade e LGPD</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuInfo}>
              <Ionicons name="help-circle-outline" size={20} color={colors.gray500} />
              <Text style={styles.menuText}>Ajuda e suporte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Logout */}
      <Button
        title="Sair da conta"
        onPress={handleLogout}
        variant="outline"
        icon="log-out-outline"
        fullWidth
        style={styles.logoutButton}
      />

      {/* Version */}
      <Text style={styles.version}>Versão 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  profileCard: {
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileProfession: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  settingDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContainer: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray300,
    padding: 2,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleContainerActive: {
    backgroundColor: colors.success,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    position: 'absolute',
    ...shadows.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginVertical: spacing.md,
  },
  messageSection: {
    gap: spacing.sm,
  },
  messageLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  messageDisplay: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  messagePreview: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: fontSize.sm * 1.5,
  },
  editContainer: {
    gap: spacing.sm,
  },
  messageInput: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  hoursSection: {
    gap: spacing.sm,
  },
  hoursLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hourBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  hourText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  hourSeparator: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  advancedText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  daysSection: {
    gap: spacing.sm,
  },
  daysLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  daysRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  dayTextActive: {
    color: colors.white,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  connectionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  connectionStatus: {
    fontSize: fontSize.xs,
    color: colors.success,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  menuInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuText: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  planBadge: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.success,
  },
  logoutButton: {
    marginTop: spacing.lg,
  },
  version: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
