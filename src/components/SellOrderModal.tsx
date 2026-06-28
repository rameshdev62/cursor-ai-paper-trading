import React, { useEffect, useState } from 'react';
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
import type { Position } from '../types';
import { colors, radius, spacing } from '../theme/colors';

type Props = {
  visible: boolean;
  position: Position | null;
  onClose: () => void;
  onSell: (symbol: string, name: string, quantity: number) => Promise<{ ok: boolean; message?: string }>;
};

export function SellOrderModal({ visible, position, onClose, onSell }: Props) {
  const [qty, setQty] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && position) {
      setQty(String(position.quantity));
    }
  }, [visible, position]);

  if (!position) return null;

  const quantity = parseInt(qty, 10) || 0;
  const estProceeds = quantity * position.currentPrice;
  const estPnL =
    quantity > 0
      ? quantity * (position.currentPrice - position.avgCost)
      : 0;
  const pnlPositive = estPnL >= 0;

  const setMax = () => setQty(String(position.quantity));

  const submit = async () => {
    setSubmitting(true);
    const result = await onSell(position.symbol, position.name, quantity);
    setSubmitting(false);
    if (result.ok) {
      Alert.alert(
        'Sell order filled',
        `Sold ₹{quantity} ₹{position.symbol} @ ₹₹{position.currentPrice.toFixed(2)}`
      );
      onClose();
    } else {
      Alert.alert('Order rejected', result.message ?? 'Could not place sell order');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Sell order</Text>
              <Text style={styles.subtitle}>
                {position.symbol} · {position.name}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.summary}>
            <SummaryCell label="Held" value={`₹{position.quantity} shares`} />
            <SummaryCell label="Avg cost" value={`₹₹{position.avgCost.toFixed(2)}`} />
            <SummaryCell label="Market" value={`₹₹{position.currentPrice.toFixed(2)}`} />
          </View>

          <Text style={styles.label}>Quantity to sell</Text>
          <View style={styles.qtyRow}>
            <TextInput
              style={styles.input}
              value={qty}
              onChangeText={setQty}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              editable={!submitting}
            />
            <Pressable style={styles.maxBtn} onPress={setMax}>
              <Text style={styles.maxBtnText}>MAX</Text>
            </Pressable>
          </View>

          <View style={styles.estimate}>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>Est. proceeds</Text>
              <Text style={styles.estimateValue}>₹{estProceeds.toFixed(2)}</Text>
            </View>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>Est. realized P&L</Text>
              <Text
                style={[
                  styles.estimateValue,
                  { color: pnlPositive ? colors.buy : colors.sell },
                ]}
              >
                {pnlPositive ? '+' : ''}₹{estPnL.toFixed(2)}
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.sellBtn, submitting && styles.sellBtnDisabled]}
            onPress={submit}
            disabled={submitting}
          >
            <Ionicons name="arrow-down-circle" size={22} color="#fff" />
            <Text style={styles.sellBtnText}>
              {submitting ? 'Placing order…' : `Sell ₹{position.symbol}`}
            </Text>
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
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
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  cellLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  cellValue: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
    marginTop: 4,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  qtyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: colors.border,
  },
  maxBtn: {
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.sellMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.sell,
  },
  maxBtnText: {
    color: colors.sell,
    fontWeight: '800',
    fontSize: 12,
  },
  estimate: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  estimateLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  estimateValue: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  sellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.sell,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  sellBtnDisabled: {
    opacity: 0.6,
  },
  sellBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
});
