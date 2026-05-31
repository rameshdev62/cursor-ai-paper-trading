import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EMAStrategyConfig, WatchlistItem } from '../types';
import { colors, radius, spacing } from '../theme/colors';

type Props = {
  visible: boolean;
  item: WatchlistItem | null;
  strategy: EMAStrategyConfig;
  heldQty?: number;
  onClose: () => void;
  onTrade: (
    symbol: string,
    name: string,
    side: 'buy' | 'sell',
    qty: number
  ) => Promise<{ ok: boolean; message?: string }>;
};

export function ChartModal({
  visible,
  item,
  strategy,
  heldQty = 0,
  onClose,
  onTrade,
}: Props) {
  const [qty, setQty] = useState('10');

  const series = useMemo(() => {
    if (!item) return null;
    // return buildChartSeries(item.symbol, strategy.fastPeriod, strategy.slowPeriod);
  }, [item, strategy]);

  if (!item || !series) return null;

  const handleTrade = async (side: 'buy' | 'sell') => {
    const quantity = parseInt(qty, 10);
    const result = await onTrade(item.symbol, item.name, side, quantity);
    if (result.ok) {
      Alert.alert('Paper trade', `${side.toUpperCase()} ${quantity} ${item.symbol} executed`);
    } else {
      Alert.alert('Trade failed', result.message ?? 'Unknown error');
    }
  };

  const signalHint =
    series.signal === 'buy'
      ? 'Fast EMA crossed above slow EMA — strategy suggests BUY'
      : series.signal === 'sell'
        ? 'Fast EMA crossed below slow EMA — strategy suggests SELL'
        : 'No clear crossover — HOLD or wait';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.topRow}>
            <View>
              <Text style={styles.title}>{item.symbol}</Text>
              <Text style={styles.subtitle}>{item.name}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.hintBox}>
            <Ionicons
              name={
                series.signal === 'buy'
                  ? 'trending-up'
                  : series.signal === 'sell'
                    ? 'trending-down'
                    : 'remove'
              }
              size={18}
              color={
                series.signal === 'buy'
                  ? colors.buy
                  : series.signal === 'sell'
                    ? colors.sell
                    : colors.hold
              }
            />
            <Text style={styles.hintText}>{signalHint}</Text>
          </View>

          <View style={styles.qtyHeader}>
            <Text style={styles.label}>Quantity (paper)</Text>
            {heldQty > 0 && (
              <Pressable onPress={() => setQty(String(heldQty))}>
                <Text style={styles.heldLink}>
                  You hold {heldQty} · tap to sell all
                </Text>
              </Pressable>
            )}
          </View>
          <TextInput
            style={styles.input}
            value={qty}
            onChangeText={setQty}
            keyboardType="number-pad"
            placeholder="10"
            placeholderTextColor={colors.textMuted}
          />
          {heldQty === 0 && (
            <Text style={styles.sellNote}>
              Sell requires an open position — buy first or use the Positions tab
            </Text>
          )}

          <View style={styles.actions}>
            <Pressable
              style={[styles.tradeBtn, styles.buyBtn]}
              onPress={() => handleTrade('buy')}
            >
              <Ionicons name="arrow-up-circle" size={20} color="#fff" />
              <Text style={styles.tradeBtnText}>Buy</Text>
            </Pressable>
            <Pressable
              style={[
                styles.tradeBtn,
                styles.sellBtn,
                heldQty === 0 && styles.tradeBtnDisabled,
              ]}
              onPress={() => handleTrade('sell')}
              disabled={heldQty === 0}
            >
              <Ionicons name="arrow-down-circle" size={20} color="#fff" />
              <Text style={styles.tradeBtnText}>Sell</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 8,
    maxHeight: '94%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hintText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  qtyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
  },
  heldLink: {
    color: colors.sell,
    fontSize: 11,
    fontWeight: '600',
  },
  sellNote: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  tradeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  buyBtn: {
    backgroundColor: colors.buy,
  },
  sellBtn: {
    backgroundColor: colors.sell,
  },
  tradeBtnDisabled: {
    opacity: 0.45,
  },
  tradeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
