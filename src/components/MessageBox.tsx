import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

type Props = {
  visible: boolean;
  type: MessageType;
  title: string;
  message?: string;
  onClose: () => void;
};

const CONFIG: Record<MessageType, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { color: '#34D399', bg: 'rgba(52,211,153,0.12)', icon: 'checkmark-circle' },
  error: { color: '#F87171', bg: 'rgba(248,113,113,0.12)', icon: 'close-circle' },
  warning: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', icon: 'warning' },
  info: { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', icon: 'information-circle' },
};

export function MessageBox({ visible, type, title, message, onClose }: Props) {
  const config = CONFIG[type];
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.8);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={36} color={config.color} />
          </View>

          <Text style={styles.title}>{title}</Text>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable style={[styles.btn, { backgroundColor: config.color }]} onPress={onClose}>
            <Text style={styles.btnText}>OK</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

type ToastProps = {
  visible: boolean;
  type: MessageType;
  message: string;
  onClose: () => void;
  duration?: number;
};

export function Toast({ visible, type, message, onClose, duration = 2500 }: ToastProps) {
  const config = CONFIG[type];
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-80);
      opacity.setValue(0);
    }
  }, [visible, translateY, opacity, onClose, duration]);

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }], backgroundColor: config.bg, borderColor: config.color }]}>
      <Ionicons name={config.icon} size={18} color={config.color} />
      <Text style={[styles.toastText, { color: config.color }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    minWidth: 260,
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  btn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    zIndex: 999,
    maxWidth: '90%',
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
});
