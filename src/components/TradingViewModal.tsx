import React, { useEffect } from 'react';
import { Modal, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { getTradingViewChartUrl } from '../utils/tradingView';
import type { WatchlistItem } from '../types';
import { colors, spacing } from '../theme/colors';

type Props = {
  visible: boolean;
  item: WatchlistItem | null;
  onClose: () => void;
};

export function TradingViewModal({ visible, item, onClose }: Props) {
  if (!item) return null;

  const url = getTradingViewChartUrl(item);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    window.open(url, '_blank');
    onClose();
  }, [visible, url, onClose]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {item.symbol}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>
        {Platform.OS !== 'web' && (
          <WebView
            source={{ uri: url }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight ?? 0,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.md,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  webview: {
    flex: 1,
  },
});
