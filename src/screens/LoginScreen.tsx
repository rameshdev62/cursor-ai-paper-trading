import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { MessageBox, type MessageType } from '../components/MessageBox';

export function LoginScreen() {
  const { login } = useAuth();

  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ visible: boolean; type: MessageType; title: string; message?: string }>({
    visible: false, type: 'error', title: '',
  });

  const handleLogin = async () => {
    if (!userid.trim() || !password.trim() || !totp.trim()) {
      setMsg({ visible: true, type: 'warning', title: 'Missing Fields', message: 'Please fill in all fields.' });
      return;
    }

    setLoading(true);
    const res = await login(userid.trim(), password.trim(), totp.trim());
    setLoading(false);

    if (!res.ok) {
      setMsg({ visible: true, type: 'error', title: 'Login Failed', message: res.error });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.background]}
        style={styles.header}
      >
        <Ionicons name="paper-plane" size={40} color={colors.primary} />
        <Text style={styles.appName}>Paper Trade</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </LinearGradient>

      <View style={styles.form}>
        <Text style={styles.label}>User ID</Text>
        <TextInput
          style={styles.input}
          value={userid}
          onChangeText={setUserid}
          placeholder="e.g. AB1234"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          editable={!loading}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <Pressable
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <Text style={styles.label}>TOTP</Text>
        <TextInput
          style={styles.input}
          value={totp}
          onChangeText={setTotp}
          placeholder="6-digit code"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={6}
          editable={!loading}
        />

        <Pressable
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="log-in" size={20} color="#fff" />
              <Text style={styles.loginBtnText}>Login</Text>
            </>
          )}
        </Pressable>
      </View>

      <MessageBox
        visible={msg.visible}
        type={msg.type}
        title={msg.title}
        message={msg.message}
        onClose={() => setMsg((p) => ({ ...p, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flex: 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  appName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  form: {
    flex: 0.65,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eyeBtn: {
    padding: spacing.md,
  },
  loginBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    marginTop: spacing.lg,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
