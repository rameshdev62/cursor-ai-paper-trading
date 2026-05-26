import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useWatchlist } from '../hooks/useWatchlist';
import { useStrategy } from '../hooks/useStrategy';
import { buildChartSeries } from '../utils/mockPrices';
import { colors, radius, spacing } from '../theme/colors';

export function StrategyScreen() {
  const { items, loading: wlLoading } = useWatchlist();
  const { config, loading: stratLoading, updateConfig } = useStrategy();
  const [fast, setFast] = useState(String(config.fastPeriod));
  const [slow, setSlow] = useState(String(config.slowPeriod));

  React.useEffect(() => {
    setFast(String(config.fastPeriod));
    setSlow(String(config.slowPeriod));
  }, [config]);

  const signals = useMemo(() => {
    return items.map((item) => {
      const series = buildChartSeries(item.symbol, config.fastPeriod, config.slowPeriod);
      return { item, signal: series.signal };
    });
  }, [items, config]);

  const save = async () => {
    const fastPeriod = parseInt(fast, 10);
    const slowPeriod = parseInt(slow, 10);
    const ok = await updateConfig({ fastPeriod, slowPeriod });
    if (!ok) {
      Alert.alert(
        'Invalid settings',
        'Fast period must be less than slow period (e.g. 9 and 21). Minimum: fast ≥ 2, slow ≥ 3.'
      );
    }
  };

  if (wlLoading || stratLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={[colors.gradientStart, colors.background]}
        style={styles.hero}
      >
        <Ionicons name="analytics" size={32} color={colors.accent} />
        <Text style={styles.heroTitle}>EMA Crossover Strategy</Text>
        <Text style={styles.heroSub}>
          Buy when fast EMA crosses above slow EMA. Sell when it crosses below.
        </Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Parameters</Text>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Fast EMA period</Text>
            <TextInput
              style={styles.input}
              value={fast}
              onChangeText={setFast}
              keyboardType="number-pad"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Slow EMA period</Text>
            <TextInput
              style={styles.input}
              value={slow}
              onChangeText={setSlow}
              keyboardType="number-pad"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
        <Pressable style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Save strategy</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Signals on watchlist</Text>
      {items.length === 0 ? (
        <Text style={styles.muted}>Add symbols to your watchlist to see signals.</Text>
      ) : (
        signals.map(({ item, signal }) => {
          const c =
            signal === 'buy' ? colors.buy : signal === 'sell' ? colors.sell : colors.hold;
          const bg =
            signal === 'buy'
              ? colors.buyMuted
              : signal === 'sell'
                ? colors.sellMuted
                : colors.holdMuted;
          return (
            <View key={item.id} style={styles.signalRow}>
              <View>
                <Text style={styles.sym}>{item.symbol}</Text>
                <Text style={styles.symName}>{item.name}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: bg }]}>
                <Ionicons
                  name={
                    signal === 'buy'
                      ? 'arrow-up'
                      : signal === 'sell'
                        ? 'arrow-down'
                        : 'pause'
                  }
                  size={14}
                  color={c}
                />
                <Text style={[styles.pillText, { color: c }]}>{signal.toUpperCase()}</Text>
              </View>
            </View>
          );
        })
      )}

      <View style={styles.rules}>
        <Text style={styles.rulesTitle}>How it works</Text>
        <Rule icon="trending-up" color={colors.buy} text="BUY: Fast EMA crosses above slow EMA" />
        <Rule icon="trending-down" color={colors.sell} text="SELL: Fast EMA crosses below slow EMA" />
        <Rule icon="time" color={colors.hold} text="HOLD: No crossover or fast below slow" />
      </View>
    </ScrollView>
  );
}

function Rule({
  icon,
  color,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  text: string;
}) {
  return (
    <View style={styles.ruleRow}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl * 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  hero: {
    padding: spacing.lg,
    paddingTop: spacing.xl + 8,
    alignItems: 'center',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  heroSub: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  field: {
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
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
  saveBtn: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  muted: {
    color: colors.textMuted,
    marginHorizontal: spacing.lg,
  },
  signalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sym: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  symName: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  pillText: {
    fontWeight: '700',
    fontSize: 12,
  },
  rules: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rulesTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ruleText: {
    color: colors.textMuted,
    fontSize: 14,
    flex: 1,
  },
});
