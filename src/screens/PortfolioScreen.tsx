import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePaperTrading } from '../context/PaperTradingContext';
import { colors, radius, spacing } from '../theme/colors';

export function PortfolioScreen() {
  const { trades, balance, portfolioValue, positions, loading } = usePaperTrading();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.background]}
        style={styles.header}
      >
        <Text style={styles.label}>Total portfolio</Text>
        <Text style={styles.balance}>
          ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        <Text style={styles.cashLine}>
          Cash ${balance.toFixed(2)} · {positions.length} open position
          {positions.length === 1 ? '' : 's'}
        </Text>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Trade history</Text>
      {trades.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>No paper trades yet</Text>
        </View>
      ) : (
        <FlatList
          data={trades}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.tradeRow}>
              <View
                style={[
                  styles.sideIcon,
                  {
                    backgroundColor:
                      item.side === 'buy' ? colors.buyMuted : colors.sellMuted,
                  },
                ]}
              >
                <Ionicons
                  name={item.side === 'buy' ? 'arrow-up' : 'arrow-down'}
                  size={18}
                  color={item.side === 'buy' ? colors.buy : colors.sell}
                />
              </View>
              <View style={styles.tradeInfo}>
                <Text style={styles.tradeSym}>
                  {item.side.toUpperCase()} {item.quantity} {item.symbol}
                </Text>
                <Text style={styles.tradeMeta}>
                  @ ${item.price.toFixed(2)} · {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>
              <Text
                style={[
                  styles.tradeTotal,
                  { color: item.side === 'buy' ? colors.sell : colors.buy },
                ]}
              >
                {item.side === 'buy' ? '-' : '+'}$
                {(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          )}
        />
      )}
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
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
  },
  balance: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  cashLine: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sideIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  tradeInfo: {
    flex: 1,
  },
  tradeSym: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  tradeMeta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  tradeTotal: {
    fontWeight: '700',
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
