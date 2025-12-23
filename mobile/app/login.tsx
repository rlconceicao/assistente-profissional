// ===========================================
// Tela de Login
// ===========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '../src/components/ui';
import { useAuthStore } from '../src/stores';
import { config } from '../src/config';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../src/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      // Abre o navegador para autenticação OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        `${config.apiUrl}/auth/google`,
        'assistentepro://auth/callback'
      );

      if (result.type === 'success' && result.url) {
        // Extrai o token da URL de callback
        const url = new URL(result.url);
        const token = url.searchParams.get('token');

        if (token) {
          await login(token);
          router.replace('/(tabs)');
        } else {
          throw new Error('Token não recebido');
        }
      }
    } catch (error) {
      console.error('Erro no login:', error);
      Alert.alert(
        'Erro no Login',
        'Não foi possível fazer login. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Para desenvolvimento/teste: login direto com token
  const handleDevLogin = async () => {
    setIsLoading(true);
    try {
      // Cole aqui um token válido para teste
      const devToken = 'SEU_TOKEN_DE_TESTE';
      await login(devToken);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Erro', 'Token inválido ou expirado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Illustration */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>✨</Text>
          </View>
          <Text style={styles.appName}>Assistente Pro</Text>
          <Text style={styles.tagline}>
            Resumos inteligentes de mensagens{'\n'}para profissionais ocupados
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { icon: '📧', text: 'Resumos automáticos de e-mails' },
            { icon: '🎙️', text: 'Transcrição de áudios' },
            { icon: '💬', text: 'Resposta automática configurável' },
            { icon: '⚡', text: 'Triagem rápida entre atendimentos' },
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        {/* Login Buttons */}
        <View style={styles.buttons}>
          <Button
            title="Entrar com Google"
            onPress={handleGoogleLogin}
            loading={isLoading}
            icon="logo-google"
            fullWidth
            size="lg"
          />

          <Text style={styles.disclaimer}>
            Ao continuar, você concorda com nossos{' '}
            <Text style={styles.link} onPress={() => Linking.openURL('https://seusite.com/termos')}>
              Termos de Uso
            </Text>{' '}
            e{' '}
            <Text style={styles.link} onPress={() => Linking.openURL('https://seusite.com/privacidade')}>
              Política de Privacidade
            </Text>
          </Text>

          {/* Dev Login (remover em produção) */}
          {__DEV__ && (
            <Button
              title="[DEV] Login com Token"
              onPress={handleDevLogin}
              variant="ghost"
              size="sm"
              style={{ marginTop: spacing.md }}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: spacing['2xl'],
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing['4xl'],
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.base * 1.5,
  },
  features: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
  buttons: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: fontSize.xs * 1.6,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
