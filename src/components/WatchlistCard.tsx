import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EMAStrategyConfig, WatchlistItem, TrendData } from '../types';
import { colors, radius, spacing } from '../theme/colors';

const TIMEFRAMES: { key: keyof TrendData; label: string }[] = [
  { key: '1m', label: '1m' },
  { key: '5m', label: '5m' },
  { key: '15m', label: '15m' },
  { key: '1h', label: '1h' },
  { key: '4h', label: '4h' },
  { key: '1d', label: '1D' },
];

type Props = {
  item: WatchlistItem;
  strategy: EMAStrategyConfig;
  onPress: () => void;
  onTrade: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefreshPrice?: () => void;
};

export function WatchlistCard({
  item,
  strategy,
  onPress,
  onTrade,
  onEdit,
  onDelete,
  onRefreshPrice,
}: Props) {
  const price = item.price ?? 0;
  const change = item.change ?? 0;
  const changePercent = item.changePercent ?? 0;

  const signal = useMemo(() => {
    if (!item.trends) return 'hold';
    let bull = 0;
    let bear = 0;
    for (const key of Object.keys(item.trends) as (keyof TrendData)[]) {
      if (item.trends[key] === 'bull') bull++;
      else if (item.trends[key] === 'bear') bear++;
    }
    if (bull > bear && bull >= 3) return 'buy';
    if (bear > bull && bear >= 3) return 'sell';
    return 'hold';
  }, [item.trends]);

  const signalColor = signal === 'buy' ? colors.buy : signal === 'sell' ? colors.sell : colors.hold;
  const signalBg = signal === 'buy' ? colors.buyMuted : signal === 'sell' ? colors.sellMuted : colors.holdMuted;
  const signalIconName = signal === 'buy' ? 'trending-up' : signal === 'sell' ? 'trending-down' : 'ellipse-outline';

  const hasTrends = useMemo(() => {
    if (!item.trends) return false;
    return Object.values(item.trends).some((val) => val === 'bull' || val === 'bear');
  }, [item.trends]);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={styles.topRow}>
          <View style={styles.left}>
            <View style={[styles.iconWrap, { backgroundColor: signalBg }]}>
              <Ionicons
                name={signalIconName}
                size={signal === 'hold' ? 14 : 20}
                color={signalColor}
              />
            </View>

            <View style={styles.info}>
              <Text style={styles.symbol}>
                {item.exchange === 'NFO'
                  ? `${item.symbol} ${item.strikePrice ?? ''} ${item.optionType ?? ''}`.trim()
                  : item.symbol}
              </Text>

              <Text style={styles.name} numberOfLines={1}>
                {item.name}
                {item.exchange ? ` · ${item.exchange}` : ''}
              </Text>

              <Text style={[styles.signalSubText, { color: signalColor }]}>
                {signal === 'buy' ? 'BULL ✅' : signal === 'sell' ? 'BEAR ❌' : 'NEUTRAL ➖'}
              </Text>
            </View>
          </View>

          <View style={styles.right}>
            <Text style={styles.price}>₹ {price.toFixed(2)}</Text>
            <View style={styles.cardActions}>
              {onRefreshPrice && (
                <Pressable
                  style={styles.actionBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    onRefreshPrice();
                  }}
                  hitSlop={6}
                >
                  <Ionicons name="refresh" size={16} color={colors.textMuted} />
                </Pressable>
              )}

              <Pressable
                style={styles.actionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  onTrade();
                }}
                hitSlop={6}
              >
                <Ionicons name="swap-horizontal" size={18} color={colors.accent} />
              </Pressable>

              <Pressable
                style={styles.actionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                hitSlop={6}
              >
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </Pressable>

              <Pressable
                style={styles.actionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                hitSlop={6}
              >
                <Ionicons name="trash-outline" size={18} color={colors.sell} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Full-width Trend Grid at the bottom (only shown when trends exist) */}
        {hasTrends && (
          <View style={styles.gridContainer}>
            {/* Headers Row */}
            <View style={styles.gridRow}>
              {TIMEFRAMES.map(({ key, label }, index) => (
                <View
                  key={`header-${key}`}
                  style={[
                    styles.gridHeaderCell,
                    index === TIMEFRAMES.length - 1 && styles.noRightBorder,
                  ]}
                >
                  <Text style={styles.gridHeaderCellText}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Values Row */}
            <View style={styles.gridRow}>
              {TIMEFRAMES.map(({ key }, index) => {
                const dir = item.trends ? item.trends[key] : null;
                const isBull = dir === 'bull';
                const isBear = dir === 'bear';

                return (
                  <View
                    key={`value-${key}`}
                    style={[
                      styles.gridValueCell,
                      index === TIMEFRAMES.length - 1 && styles.noRightBorder,
                    ]}
                  >
                    {isBull ? (
                      <Text style={[styles.gridValueText, styles.bullText]}>BULL ✅</Text>
                    ) : isBear ? (
                      <Text style={[styles.gridValueText, styles.bearText]}>BEAR ❌</Text>
                    ) : (
                      <Text style={[styles.gridValueText, styles.neutText]}>NEUT ➖</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    alignSelf: 'stretch',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  symbol: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  name: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  signalSubText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  price: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  actionBtn: {
    padding: 6,
  },
  gridContainer: {
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridHeaderCell: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#1F2937',
  },
  gridHeaderCellText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  gridValueCell: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  gridValueText: {
    fontSize: 7,
    fontWeight: '800',
    textAlign: 'center',
  },
  bullText: {
    color: '#10B981',
  },
  bearText: {
    color: '#EF4444',
  },
  neutText: {
    color: '#94A3B8',
  },
  noRightBorder: {
    borderRightWidth: 0,
  },
});