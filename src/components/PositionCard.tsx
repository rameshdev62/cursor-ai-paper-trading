import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Position } from '../types';
import { colors, radius, spacing } from '../theme/colors';

type Props = {
  position: Position;
  onSell: () => void;
};

export function PositionCard({ position, onSell }: Props) {
  const pnlUp = position.unrealizedPnL >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Text style={styles.iconText}>{position.symbol.slice(0, 2)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.symbol}>{position.symbol}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {position.name}
          </Text>
        </View>
        <View style={styles.valueCol}>
          <Text style={styles.marketValue}>₹{position.marketValue.toFixed(2)}</Text>
          <Text style={[styles.pnl, { color: pnlUp ? colors.buy : colors.sell }]}>
            {pnlUp ? '+' : ''}₹{position.unrealizedPnL.toFixed(2)} (
            {pnlUp ? '+' : ''}
            {position.unrealizedPnLPercent.toFixed(1)}%)
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="Qty" value={`₹{position.quantity}`} />
        <Stat label="Avg cost" value={`₹₹{position.avgCost.toFixed(2)}`} />
        <Stat label="Last" value={`₹₹{position.currentPrice.toFixed(2)}`} />
        <Stat label="Cost basis" value={`₹₹{position.costBasis.toFixed(2)}`} />
      </View>

      <Pressable style={styles.sellBtn} onPress={onSell}>
        <Ionicons name="arrow-down-circle-outline" size={18} color="#fff" />
        <Text style={styles.sellBtnText}>Sell</Text>
      </Pressable>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDark + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  symbol: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  name: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  valueCol: {
    alignItems: 'flex-end',
  },
  marketValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  pnl: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing.md,
  },
  stat: {
    width: '47%',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  sellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.sell,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  sellBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
