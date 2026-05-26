import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { WatchlistItem } from '../types';
import { ChartModal } from '../components/ChartModal';
import { WatchlistCard } from '../components/WatchlistCard';
import { WatchlistFormModal } from '../components/WatchlistFormModal';
import { useWatchlist } from '../hooks/useWatchlist';
import { usePaperTrading } from '../context/PaperTradingContext';
import { useStrategy } from '../hooks/useStrategy';
import { colors, radius, spacing } from '../theme/colors';

export function WatchlistScreen() {
  const { items, loading, addItem, updateItem, removeItem } = useWatchlist();
  const { config: strategy } = useStrategy();
  const { executeTrade, balance, getHeldQty } = usePaperTrading();
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<WatchlistItem | null>(null);
  const [chartItem, setChartItem] = useState<WatchlistItem | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormVisible(true);
  };

  const openEdit = (item: WatchlistItem) => {
    setEditing(item);
    setFormVisible(true);
  };

  const confirmDelete = (item: WatchlistItem) => {
    Alert.alert('Remove from watchlist', `Delete ${item.symbol}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeItem(item.id) },
    ]);
  };

  const handleSave = async (symbol: string, name: string) => {
    if (editing) return updateItem(editing.id, symbol, name);
    return addItem(symbol, name);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.background]}
        style={styles.header}
      >
        <Text style={styles.greeting}>Paper Trade</Text>
        <Text style={styles.balanceLabel}>Virtual balance</Text>
        <Text style={styles.balance}>
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      </LinearGradient>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Watchlist</Text>
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="list-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No symbols yet</Text>
          <Text style={styles.emptyText}>Tap Add to build your watchlist</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <WatchlistCard
              item={item}
              strategy={strategy}
              onPress={() => setChartItem(item)}
              onEdit={() => openEdit(item)}
              onDelete={() => confirmDelete(item)}
            />
          )}
        />
      )}

      <WatchlistFormModal
        visible={formVisible}
        editing={editing}
        onClose={() => setFormVisible(false)}
        onSave={handleSave}
      />

      <ChartModal
        visible={chartItem != null}
        item={chartItem}
        strategy={strategy}
        heldQty={chartItem ? getHeldQty(chartItem.symbol) : 0}
        onClose={() => setChartItem(null)}
        onTrade={executeTrade}
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
    paddingTop: spacing.xl + 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  greeting: {
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  balanceLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  balance: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loader: {
    marginTop: spacing.xl,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
