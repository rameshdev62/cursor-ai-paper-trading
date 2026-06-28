import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import type {
  WatchlistEntryInput,
  WatchlistItem,
} from '../types';

import { ChartModal } from '../components/ChartModal';
import { WatchlistCard } from '../components/WatchlistCard';
import { WatchlistFormModal } from '../components/WatchlistFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { MessageBox, type MessageType } from '../components/MessageBox';

import { useWatchlist } from '../hooks/useWatchlist';
import { usePaperTrading } from '../context/PaperTradingContext';
import { useStrategy } from '../hooks/useStrategy';

import {
  colors,
  radius,
  spacing,
} from '../theme/colors';

import { openTradingViewChart } from '../utils/tradingView';
import { setTokenExpiredHandler, setApiBase } from '../utils/api';
import { loadApiUrl } from '../utils/storage';

export function WatchlistScreen() {
  const {
    items,
    loading,
    addItem,
    updateItem,
    removeItem,
  } = useWatchlist();

  const { config: strategy } = useStrategy();

  const {
    executeTrade,
    balance,
    getHeldQty,
  } = usePaperTrading();

  const [formVisible, setFormVisible] =
    useState(false);

  const [editing, setEditing] =
    useState<WatchlistItem | null>(null);

  const [tradeItem, setTradeItem] =
    useState<WatchlistItem | null>(null);

  const [deleteItem, setDeleteItem] =
    useState<WatchlistItem | null>(null);

  const [msgBox, setMsgBox] = useState<{ visible: boolean; type: MessageType; title: string; message?: string }>({
    visible: false, type: 'error', title: '',
  });

  const showMsg = useCallback((type: MessageType, title: string, message?: string) => {
    setMsgBox({ visible: true, type, title, message });
  }, []);

  useEffect(() => {
    setTokenExpiredHandler(() => showMsg('error', 'Token Expired', 'Session expired. Please login again.'));
  }, [showMsg]);

  useEffect(() => {
    loadApiUrl().then(setApiBase);
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormVisible(true);
  };

  const openEdit = (
    item: WatchlistItem
  ) => {
    setEditing(item);
    setFormVisible(true);
  };

  const openDeleteDialog = (
    item: WatchlistItem
  ) => {
    setDeleteItem(item);
  };

  const handleDeleteConfirm =
    async () => {
      if (!deleteItem) return;

      await removeItem(deleteItem.id);

      setDeleteItem(null);
    };

  const handleSave = async (
    entry: WatchlistEntryInput
  ) => {
    if (editing) {
      return updateItem(
        editing.id,
        entry
      );
    }

    return addItem(entry);
  };

  const handleOpenChart = async (
    item: WatchlistItem
  ) => {
    await openTradingViewChart(item);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          colors.gradientStart,
          colors.background,
        ]}
        style={styles.header}
      >
        <Text style={styles.greeting}>
          Paper Trade
        </Text>

        <Text style={styles.balanceLabel}>
          Virtual Balance
        </Text>

        <Text style={styles.balance}>
          ₹
          {balance.toLocaleString(
            'en-US',
            {
              minimumFractionDigits: 2,
            }
          )}
        </Text>
      </LinearGradient>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>
          Watchlist
        </Text>

        <Pressable
          style={styles.addBtn}
          onPress={openAdd}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator
          color={colors.primary}
          style={styles.loader}
        />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="list-outline"
            size={48}
            color={colors.textMuted}
          />

          <Text style={styles.emptyTitle}>
            No symbols yet
          </Text>

          <Text style={styles.emptyText}>
            Tap Add to build your
            watchlist
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) =>
            item.id
          }
          contentContainerStyle={
            styles.list
          }
          renderItem={({ item }) => (
            <WatchlistCard
              item={item}
              strategy={strategy}
              onPress={() =>
                handleOpenChart(item)
              }
              onTrade={() =>
                setTradeItem(item)
              }
              onEdit={() =>
                openEdit(item)
              }
              onDelete={() =>
                openDeleteDialog(item)
              }
            />
          )}
        />
      )}

      <WatchlistFormModal
        visible={formVisible}
        editing={editing}
        onClose={() =>
          setFormVisible(false)
        }
        onSave={handleSave}
      />

      <ChartModal
        visible={tradeItem != null}
        item={tradeItem}
        strategy={strategy}
        heldQty={
          tradeItem
            ? getHeldQty(
                tradeItem.symbol
              )
            : 0
        }
        onClose={() =>
          setTradeItem(null)
        }
        onTrade={executeTrade}
      />

      <ConfirmDialog
        visible={deleteItem !== null}
        title="Remove Symbol"
        message={
          deleteItem
            ? `Are you sure you want to remove ${deleteItem.symbol} from your watchlist?`
            : ''
        }
        onCancel={() =>
          setDeleteItem(null)
        }
        onConfirm={
          handleDeleteConfirm
        }
      />

      <MessageBox
        visible={msgBox.visible}
        type={msgBox.type}
        title={msgBox.title}
        message={msgBox.message}
        onClose={() => setMsgBox((p) => ({ ...p, visible: false }))}
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
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
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