// ===========================================
// Componentes de UI Reutilizáveis
// ===========================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';

// ==========================================
// Button
// ==========================================
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    fullWidth && styles.buttonFullWidth,
    isDisabled && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    styles[`buttonText_${variant}`],
    styles[`buttonText_${size}`],
  ];

  const iconColor =
    variant === 'primary' ? colors.white : variant === 'outline' ? colors.primary : colors.primary;
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconLeft} />
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconRight} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

// ==========================================
// Card
// ==========================================
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Container>
  );
};

// ==========================================
// Badge
// ==========================================
interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', size = 'md' }) => {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], styles[`badge_${size}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${variant}`], styles[`badgeText_${size}`]]}>
        {label}
      </Text>
    </View>
  );
};

// ==========================================
// Avatar
// ==========================================
interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  source?: 'GMAIL' | 'WHATSAPP' | 'OUTLOOK';
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', source }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const bgColor = source
    ? source === 'GMAIL'
      ? colors.gmail
      : source === 'WHATSAPP'
      ? colors.whatsapp
      : colors.outlook
    : colors.primary;

  return (
    <View style={[styles.avatar, styles[`avatar_${size}`], { backgroundColor: bgColor }]}>
      <Text style={[styles.avatarText, styles[`avatarText_${size}`]]}>{initials}</Text>
    </View>
  );
};

// ==========================================
// SourceIcon
// ==========================================
interface SourceIconProps {
  source: 'GMAIL' | 'WHATSAPP' | 'OUTLOOK';
  size?: number;
}

export const SourceIcon: React.FC<SourceIconProps> = ({ source, size = 16 }) => {
  const iconName =
    source === 'GMAIL' ? 'mail' : source === 'WHATSAPP' ? 'logo-whatsapp' : 'mail-outline';
  const iconColor =
    source === 'GMAIL' ? colors.gmail : source === 'WHATSAPP' ? colors.whatsapp : colors.outlook;

  return <Ionicons name={iconName} size={size} color={iconColor} />;
};

// ==========================================
// StatusIndicator
// ==========================================
interface StatusIndicatorProps {
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  if (status === 'UNREAD') {
    return <View style={styles.unreadDot} />;
  }
  if (status === 'REPLIED') {
    return <Ionicons name="checkmark-done" size={16} color={colors.success} />;
  }
  return <Ionicons name="checkmark" size={16} color={colors.gray400} />;
};

// ==========================================
// EmptyState
// ==========================================
interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={64} color={colors.gray300} />
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {description && <Text style={styles.emptyStateDescription}>{description}</Text>}
      {action && (
        <Button title={action.label} onPress={action.onPress} variant="outline" style={{ marginTop: spacing.lg }} />
      )}
    </View>
  );
};

// ==========================================
// Loading
// ==========================================
interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message }) => {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={styles.loadingText}>{message}</Text>}
    </View>
  );
};

// ==========================================
// Styles
// ==========================================
const styles = StyleSheet.create({
  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  button_primary: {
    backgroundColor: colors.primary,
  },
  button_secondary: {
    backgroundColor: colors.secondary,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  button_md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  button_lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: fontWeight.semibold,
  },
  buttonText_primary: {
    color: colors.white,
  },
  buttonText_secondary: {
    color: colors.white,
  },
  buttonText_outline: {
    color: colors.primary,
  },
  buttonText_ghost: {
    color: colors.primary,
  },
  buttonText_sm: {
    fontSize: fontSize.sm,
  },
  buttonText_md: {
    fontSize: fontSize.base,
  },
  buttonText_lg: {
    fontSize: fontSize.lg,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },

  // Badge
  badge: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badge_default: {
    backgroundColor: colors.gray100,
  },
  badge_success: {
    backgroundColor: colors.successBg,
  },
  badge_warning: {
    backgroundColor: colors.warningBg,
  },
  badge_error: {
    backgroundColor: colors.errorBg,
  },
  badge_info: {
    backgroundColor: colors.infoBg,
  },
  badge_sm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  badge_md: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  badgeText: {
    fontWeight: fontWeight.medium,
  },
  badgeText_default: {
    color: colors.gray700,
  },
  badgeText_success: {
    color: colors.success,
  },
  badgeText_warning: {
    color: colors.warning,
  },
  badgeText_error: {
    color: colors.error,
  },
  badgeText_info: {
    color: colors.info,
  },
  badgeText_sm: {
    fontSize: fontSize.xs,
  },
  badgeText_md: {
    fontSize: fontSize.sm,
  },

  // Avatar
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  avatar_sm: {
    width: 32,
    height: 32,
  },
  avatar_md: {
    width: 48,
    height: 48,
  },
  avatar_lg: {
    width: 64,
    height: 64,
  },
  avatarText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  avatarText_sm: {
    fontSize: fontSize.xs,
  },
  avatarText_md: {
    fontSize: fontSize.base,
  },
  avatarText_lg: {
    fontSize: fontSize.xl,
  },

  // StatusIndicator
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  // EmptyState
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  emptyStateTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  // Loading
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
