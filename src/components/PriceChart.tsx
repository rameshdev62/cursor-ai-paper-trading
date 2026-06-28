import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import type { ChartSeries } from '../types';
import { colors, radius, spacing } from '../theme/colors';

const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 28, left: 48 };

type Props = {
  series: ChartSeries;
  symbol: string;
};

function buildPath(
  values: (number | null)[],
  width: number,
  height: number,
  min: number,
  max: number
): string {
  const range = max - min || 1;
  const plotW = width - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;
  let d = '';
  let started = false;

  values.forEach((v, i) => {
    if (v == null) return;
    const x = PADDING.left + (i / (values.length - 1)) * plotW;
    const y = PADDING.top + plotH - ((v - min) / range) * plotH;
    d += started ? ` L ${x} ${y}` : `M ${x} ${y}`;
    started = true;
  });
  return d;
}

export function PriceChart({ series, symbol }: Props) {
  const width = Dimensions.get('window').width - spacing.md * 2;
  const { prices, fastEma, slowEma, signal } = series;

  const { min, max, pricePath, fastPath, slowPath, lastPrice } = useMemo(() => {
    const allValues = [
      ...prices.map((p) => p.close),
      ...fastEma.filter((v): v is number => v != null),
      ...slowEma.filter((v): v is number => v != null),
    ];
    const minV = Math.min(...allValues) * 0.98;
    const maxV = Math.max(...allValues) * 1.02;
    return {
      min: minV,
      max: maxV,
      pricePath: buildPath(
        prices.map((p) => p.close),
        width,
        CHART_HEIGHT,
        minV,
        maxV
      ),
      fastPath: buildPath(fastEma, width, CHART_HEIGHT, minV, maxV),
      slowPath: buildPath(slowEma, width, CHART_HEIGHT, minV, maxV),
      lastPrice: prices[prices.length - 1]?.close ?? 0,
    };
  }, [prices, fastEma, slowEma, width]);

  const signalColor =
    signal === 'buy' ? colors.buy : signal === 'sell' ? colors.sell : colors.hold;

  const lastIdx = prices.length - 1;
  const plotW = width - PADDING.left - PADDING.right;
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const range = max - min || 1;
  const dotX = PADDING.left + (lastIdx / (prices.length - 1)) * plotW;
  const dotY = PADDING.top + plotH - ((lastPrice - min) / range) * plotH;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.symbol}>{symbol}</Text>
        <Text style={styles.price}>₹{lastPrice.toFixed(2)}</Text>
        <View style={[styles.badge, { backgroundColor: `${signalColor}22` }]}>
          <Text style={[styles.badgeText, { color: signalColor }]}>
            EMA {signal.toUpperCase()}
          </Text>
        </View>
      </View>
      <Svg width={width} height={CHART_HEIGHT}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PADDING.top + plotH * (1 - t);
          const val = min + range * t;
          return (
            <React.Fragment key={t}>
              <Line
                x1={PADDING.left}
                y1={y}
                x2={width - PADDING.right}
                y2={y}
                stroke={colors.border}
                strokeWidth={0.5}
                strokeDasharray="4 4"
              />
              <SvgText
                x={4}
                y={y + 4}
                fill={colors.textMuted}
                fontSize={9}
              >
                {val.toFixed(0)}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Path d={pricePath} stroke={colors.chartPrice} strokeWidth={2} fill="none" />
        <Path d={fastPath} stroke={colors.chartFastEma} strokeWidth={1.5} fill="none" />
        <Path d={slowPath} stroke={colors.chartSlowEma} strokeWidth={1.5} fill="none" />
        <Circle cx={dotX} cy={dotY} r={5} fill={colors.chartPrice} />
      </Svg>
      <View style={styles.legend}>
        <LegendDot color={colors.chartPrice} label="Price" />
        <LegendDot color={colors.chartFastEma} label="Fast EMA" />
        <LegendDot color={colors.chartSlowEma} label="Slow EMA" />
      </View>
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
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  symbol: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  price: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginLeft: 'auto',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
