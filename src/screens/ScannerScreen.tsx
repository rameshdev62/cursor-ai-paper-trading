import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { fetchWatchlist, refreshWatchlistLTP, setApiBase } from '../utils/api';
import { loadApiUrl } from '../utils/storage';
import { WatchlistItem, TrendData } from '../types';
import { TradingViewModal } from '../components/TradingViewModal';
import { ChartModal } from '../components/ChartModal';
import { usePaperTrading } from '../context/PaperTradingContext';
import { useStrategy } from '../hooks/useStrategy';

const TIMEFRAMES: { key: keyof TrendData; label: string }[] = [
  { key: '1m', label: '1m' },
  { key: '5m', label: '5m' },
  { key: '15m', label: '15m' },
  { key: '1h', label: '1H' },
  { key: '4h', label: '4H' },
  { key: '1d', label: 'D' },
];

function parseOptionFromSymbol(symbol: string): { optionType?: string; strikePrice?: string; expiry?: string } {
  const upper = symbol.toUpperCase();

  const withExpiry = upper.match(/^(.+?)(\d{2}[A-Z]{3}\d{2,4}?)(C|P|CE|PE)(\d+)$/i);
  if (withExpiry) {
    return { expiry: withExpiry[2], strikePrice: withExpiry[4], optionType: withExpiry[3].toUpperCase() === 'C' ? 'CE' : 'PE' };
  }

  const simple = upper.match(/^(.+?)(C|P|CE|PE)(\d+)$/i);
  if (simple) {
    return { strikePrice: simple[3], optionType: simple[2].toUpperCase() === 'C' ? 'CE' : 'PE' };
  }

  return {};
}

function mapApiItem(item: any): WatchlistItem {
  const parsed = parseOptionFromSymbol(item.symbol);
  let trendsObj = undefined;
  if (item.trends) {
    try {
      trendsObj = typeof item.trends === 'string' ? JSON.parse(item.trends) : item.trends;
    } catch (e) {
      console.error('Failed to parse trends', e);
    }
  }
  return {
    id: String(item.id),
    symbol: item.symbol,
    name: item.symbol,
    token: item.token ?? undefined,
    exchange: item.exchange,
    tradingSymbol: item.symbol,
    price: item.ltp ?? 0,
    optionType: item.option_type ?? parsed.optionType,
    strikePrice: (item.strike_price ?? parsed.strikePrice ?? '').replace(/\.00$/, ''),
    expiry: item.expiry ?? parsed.expiry,
    addedAt: new Date(item.added_at).getTime(),
    trends: trendsObj,
  };
}

export function ScannerScreen() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState<'bullish' | 'bearish'>('bullish');
  const [chartItem, setChartItem] = useState<WatchlistItem | null>(null);
  const [tradeItem, setTradeItem] = useState<WatchlistItem | null>(null);

  const { executeTrade } = usePaperTrading();
  const { config: strategy } = useStrategy();

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      // Refresh prices first to get fresh trend data
      await refreshWatchlistLTP();
      const raw = await fetchWatchlist();
      setItems(raw.map(mapApiItem));
    } catch (error) {
      console.error('Failed to load scanner watchlist items', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadApiUrl().then(setApiBase);
    loadData();
  }, [loadData]);

  // Compute bullish/bearish indicator counts
  const scannedItems = useMemo(() => {
    return items.map((item) => {
      let bullCount = 0;
      let bearCount = 0;
      if (item.trends) {
        for (const key of Object.keys(item.trends) as (keyof TrendData)[]) {
          if (item.trends[key] === 'bull') {
            bullCount++;
          } else if (item.trends[key] === 'bear') {
            bearCount++;
          }
        }
      }
      return { ...item, bullCount, bearCount };
    });
  }, [items]);

  // Filter and sort for the Bullish tab (ranked by strength descending)
  const bullishList = useMemo(() => {
    return scannedItems
      .filter((x) => x.bullCount > 0)
      .sort((a, b) => b.bullCount - a.bullCount);
  }, [scannedItems]);

  // Filter and sort for the Bearish tab (ranked by strength descending)
  const bearishList = useMemo(() => {
    return scannedItems
      .filter((x) => x.bearCount > 0)
      .sort((a, b) => b.bearCount - a.bearCount);
  }, [scannedItems]);

  const activeList = activeSegment === 'bullish' ? bullishList : bearishList;

  const renderScannerCard = ({ item }: { item: typeof scannedItems[0] }) => {
    const isBull = activeSegment === 'bullish';
    const score = isBull ? item.bullCount : item.bearCount;
    const strengthColor = isBull ? colors.buy : colors.sell;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          {/* Top Row */}
          <View style={styles.topRow}>
            <View style={styles.left}>
              <View style={[styles.iconWrap, { backgroundColor: isBull ? colors.buyMuted : colors.sellMuted }]}>
                <Ionicons 
                  name={isBull ? "trending-up" : "trending-down"} 
                  size={20} 
                  color={strengthColor} 
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.symbol}>
                  {item.exchange === 'NFO'
                    ? `${item.symbol} ${item.strikePrice ?? ''} ${item.optionType ?? ''}`.trim()
                    : item.symbol}
                </Text>
                <Text style={[styles.strengthText, { color: strengthColor }]}>
                  {isBull ? 'BULL' : 'BEAR'} Strength: {score} / 6
                </Text>
              </View>
            </View>

            <View style={styles.right}>
              <Text style={styles.price}>₹ {(item.price ?? 0).toFixed(2)}</Text>
              <View style={styles.cardActions}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => setChartItem(item)}
                  hitSlop={8}
                >
                  <Ionicons name="bar-chart-outline" size={18} color={colors.accent} />
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.tradeBtn]}
                  onPress={() => setTradeItem(item)}
                  hitSlop={8}
                >
                  <Text style={styles.tradeBtnText}>Trade</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Timeframe Grid */}
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
                const cellBull = dir === 'bull';
                const cellBear = dir === 'bear';

                return (
                  <View
                    key={`value-${key}`}
                    style={[
                      styles.gridValueCell,
                      index === TIMEFRAMES.length - 1 && styles.noRightBorder,
                    ]}
                  >
                    {cellBull ? (
                      <Text style={[styles.gridValueText, styles.bullText]}>BULL ✅</Text>
                    ) : cellBear ? (
                      <Text style={[styles.gridValueText, styles.bearText]}>BEAR ❌</Text>
                    ) : (
                      <Text style={[styles.gridValueText, styles.neutText]}>NEUT ➖</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.background]}
        style={styles.header}
      >
        <Text style={styles.title}>Market Scanner</Text>
        <Text style={styles.subtitle}>Watchlist trend strength rankings</Text>
      </LinearGradient>

      {/* Segmented Switcher */}
      <View style={styles.segmentContainer}>
        <Pressable
          style={[
            styles.segmentBtn,
            activeSegment === 'bullish' && styles.activeBullSegment,
          ]}
          onPress={() => setActiveSegment('bullish')}
        >
          <Ionicons 
            name="trending-up" 
            size={16} 
            color={activeSegment === 'bullish' ? '#fff' : colors.textMuted} 
            style={styles.segmentIcon}
          />
          <Text
            style={[
              styles.segmentText,
              activeSegment === 'bullish' && styles.activeSegmentText,
            ]}
          >
            Bullish ({bullishList.length})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segmentBtn,
            activeSegment === 'bearish' && styles.activeBearSegment,
          ]}
          onPress={() => setActiveSegment('bearish')}
        >
          <Ionicons 
            name="trending-down" 
            size={16} 
            color={activeSegment === 'bearish' ? '#fff' : colors.textMuted} 
            style={styles.segmentIcon}
          />
          <Text
            style={[
              styles.segmentText,
              activeSegment === 'bearish' && styles.activeSegmentText,
            ]}
          >
            Bearish ({bearishList.length})
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Scanning watchlist indicators...</Text>
        </View>
      ) : (
        <FlatList
          data={activeList}
          keyExtractor={(item) => item.id}
          renderItem={renderScannerCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>No Scanner Results</Text>
              <Text style={styles.emptyText}>
                No watchlist symbols currently match the {activeSegment} scanning criteria.
              </Text>
            </View>
          }
        />
      )}

      {/* Trade Sheet Overlay */}
      <ChartModal
        visible={tradeItem !== null}
        item={tradeItem}
        strategy={strategy}
        onClose={() => setTradeItem(null)}
        onTrade={executeTrade}
      />

      {/* Chart View Overlay */}
      <TradingViewModal
        visible={chartItem !== null}
        item={chartItem}
        onClose={() => setChartItem(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderColor: colors.border,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  segmentIcon: {
    marginRight: 6,
  },
  activeBullSegment: {
    backgroundColor: colors.buy,
  },
  activeBearSegment: {
    backgroundColor: colors.sell,
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  activeSegmentText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
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
  strengthText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
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
  },
  actionBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  tradeBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 13,
  },
});
