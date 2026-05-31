import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EMAStrategyConfig, WatchlistItem } from '../types';
import { colors, radius, spacing } from '../theme/colors';

type Props = {
  item: WatchlistItem;
  strategy: EMAStrategyConfig;
  onPress: () => void;
  onTrade: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function WatchlistCard({
  item,
  strategy,
  onPress,
  onTrade,
  onEdit,
  onDelete,
}: Props) {
  const price = useMemo(
    () => 0,
    [item.symbol]
  );

  const signal = useMemo(() => {
    const series=[];
    // const series = buildChartSeries(
    //   item.symbol,
    //   strategy.fastPeriod,
    //   strategy.slowPeriod
    // );

    return series.signal;
  }, [item.symbol, strategy.fastPeriod, strategy.slowPeriod]);

  const signalColor =
    signal === 'buy'
      ? colors.buy
      : signal === 'sell'
      ? colors.sell
      : colors.hold;

  const signalBg =
    signal === 'buy'
      ? colors.buyMuted
      : signal === 'sell'
      ? colors.sellMuted
      : colors.holdMuted;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Text style={styles.iconLetter}>
            {item.symbol.slice(0, 2)}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.symbol}>
            {item.tradingSymbol ?? item.symbol}
          </Text>

          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {item.name}
            {item.exchange
              ? ` · ${item.exchange}`
              : ''}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.price}>
          ₹ {price.toFixed(2)}
        </Text>

        <View
          style={[
            styles.signal,
            { backgroundColor: signalBg },
          ]}
        >
          <Text
            style={[
              styles.signalText,
              { color: signalColor },
            ]}
          >
            {signal}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.actionBtn}
          onPress={(e) => {
            e.stopPropagation();
            onTrade();
          }}
        >
          <Ionicons
            name="swap-horizontal"
            size={18}
            color={colors.accent}
          />
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Ionicons
            name="pencil"
            size={18}
            color={colors.primary}
          />
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={colors.sell}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDark + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLetter: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  symbol: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  name: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  price: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '600',
  },
  signal: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  signalText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
});