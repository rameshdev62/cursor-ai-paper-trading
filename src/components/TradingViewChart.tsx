import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { EMAStrategyConfig, SignalType } from '../types';
import {
  buildTradingViewChartData,
  getTradingViewSymbol,
} from '../utils/mockPrices';
import {
  buildLightweightChartsHtml,
  buildTradingViewWidgetHtml,
} from '../chart/buildTradingViewHtml';
import { colors, radius, spacing } from '../theme/colors';

type ChartMode = 'lightweight' | 'widget';

type Props = {
  symbol: string;
  strategy: EMAStrategyConfig;
  height?: number;
};

function signalColor(signal: SignalType): string {
  if (signal === 'buy') return colors.buy;
  if (signal === 'sell') return colors.sell;
  return colors.hold;
}

export function TradingViewChart({ symbol, strategy, height = 300 }: Props) {
  const tvSymbol = getTradingViewSymbol(symbol);
  const [mode, setMode] = useState<ChartMode>(tvSymbol ? 'widget' : 'lightweight');
  const [loading, setLoading] = useState(true);

  const chartData = useMemo(
    () => buildTradingViewChartData(symbol, strategy.fastPeriod, strategy.slowPeriod),
    [symbol, strategy.fastPeriod, strategy.slowPeriod]
  );

  const html = useMemo(() => {
    if (mode === 'widget' && tvSymbol) {
      return buildTradingViewWidgetHtml(tvSymbol);
    }
    return buildLightweightChartsHtml(chartData);
  }, [mode, tvSymbol, chartData]);

  const signal = chartData.signal;
  const sigColor = signalColor(signal);

  return (
    <View style={[styles.wrap, { height }]}>
      <View style={styles.toolbar}>
        <View style={styles.priceRow}>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.price}>${chartData.lastPrice.toFixed(2)}</Text>
          <View style={[styles.badge, { backgroundColor: `${sigColor}22` }]}>
            <Text style={[styles.badgeText, { color: sigColor }]}>
              EMA {signal.toUpperCase()}
            </Text>
          </View>
        </View>
        {tvSymbol ? (
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeBtn, mode === 'widget' && styles.modeBtnActive]}
              onPress={() => {
                setLoading(true);
                setMode('widget');
              }}
            >
              <Text
                style={[styles.modeText, mode === 'widget' && styles.modeTextActive]}
              >
                TradingView
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, mode === 'lightweight' && styles.modeBtnActive]}
              onPress={() => {
                setLoading(true);
                setMode('lightweight');
              }}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === 'lightweight' && styles.modeTextActive,
                ]}
              >
                Paper EMA
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.modeHint}>TradingView · Lightweight Charts</Text>
        )}
      </View>

      <View style={styles.chartBox}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}
        <WebView
          key={`${symbol}-${mode}-${strategy.fastPeriod}-${strategy.slowPeriod}`}
          source={{ html }}
          style={styles.webview}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          onMessage={() => setLoading(false)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      </View>

      {mode === 'lightweight' && (
        <View style={styles.legend}>
          <LegendDot color={colors.buy} label="Up" />
          <LegendDot color={colors.sell} label="Down" />
          <LegendDot color={colors.chartFastEma} label={`EMA ${strategy.fastPeriod}`} />
          <LegendDot color={colors.chartSlowEma} label={`EMA ${strategy.slowPeriod}`} />
        </View>
      )}
      {mode === 'widget' && (
        <Text style={styles.liveNote}>
          Live TradingView chart · add EMA studies from the chart toolbar
        </Text>
      )}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  toolbar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  symbol: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  price: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginLeft: 'auto',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  modeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtnActive: {
    backgroundColor: colors.primaryDark + '44',
    borderColor: colors.primary,
  },
  modeText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  modeTextActive: {
    color: colors.primary,
  },
  modeHint: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: spacing.xs,
  },
  chartBox: {
    flex: 1,
    minHeight: 200,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    zIndex: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  liveNote: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
