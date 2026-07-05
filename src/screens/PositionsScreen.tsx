import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Position } from '../types';
import { PositionCard } from '../components/PositionCard';
import { SellOrderModal } from '../components/SellOrderModal';
import { usePaperTrading } from '../context/PaperTradingContext';
import { colors, radius, spacing } from '../theme/colors';

export function PositionsScreen() {
  const { positions, balance, portfolioValue, loading, executeTrade } = usePaperTrading();
  const [sellPosition, setSellPosition] = useState<Position | null>(null);

  const positionsValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const totalPnL = positions.reduce((s, p) => s + p.unrealizedPnL, 0);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.background]}
        style={styles.header}
      >
        <Text style={styles.greeting}>Open positions</Text>
        <Text style={styles.totalValue}>
         ₹ {portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        <Text style={styles.subLabel}>Total portfolio · cash + holdings</Text>
        <View style={styles.statsRow}>
          <HeaderStat label="Cash" value={`₹ ${balance.toFixed(0)}`} />
          <HeaderStat label="Invested" value={` ₹ ${positionsValue.toFixed(0)}`} />
          <HeaderStat
            label="Unrealized P&L"
            value={`${totalPnL >= 0 ? '+' : ''}₹ ${totalPnL.toFixed(2)}`}
            valueColor={totalPnL >= 0 ? colors.buy : colors.sell}
          />
        </View>
      </LinearGradient>

      {positions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="briefcase-outline" size={52} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No open positions</Text>
          <Text style={styles.emptyText}>
            Buy from the watchlist chart, then sell here when you are ready.
          </Text>
        </View>
      ) : (
        <FlatList
          data={positions}
          keyExtractor={(p) => p.symbol}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.listTitle}>
              {positions.length} position{positions.length === 1 ? '' : 's'}
            </Text>
          }
          renderItem={({ item }) => (
            <PositionCard position={item} onSell={() => setSellPosition(item)} />
          )}
        />
      )}

      <SellOrderModal
        visible={sellPosition != null}
        position={sellPosition}
        onClose={() => setSellPosition(null)}
        onSell={(symbol, name, qty) => executeTrade(symbol, name, 'sell', qty)}
      />
    </View>
  );
}

function HeaderStat({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.headerStat}>
      <Text style={styles.headerStatLabel}>{label}</Text>
      <Text style={[styles.headerStatValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xl + 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  greeting: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  subLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  headerStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  headerStatLabel: {
    color: colors.textMuted,
    fontSize: 10,
  },
  headerStatValue: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 4,
  },
  listTitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
