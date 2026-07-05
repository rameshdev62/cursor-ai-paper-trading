import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import type {
  WatchlistEntryInput,
  WatchlistItem,
} from '../types';

import { ChartModal } from '../components/ChartModal';
import { TradingViewModal } from '../components/TradingViewModal';
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

import { setTokenExpiredHandler, setApiBase } from '../utils/api';
import {
  loadApiUrl,
  loadWatchlistTabs,
  saveWatchlistTabs,
  loadActiveWatchlistTab,
  saveActiveWatchlistTab,
} from '../utils/storage';

export function WatchlistScreen() {
  const [tabs, setTabs] = useState<string[]>(['Default']);
  const [activeTab, setActiveTab] = useState('Default');
  const [newTabVisible, setNewTabVisible] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [deleteTabVisible, setDeleteTabVisible] = useState(false);

  const {
    items,
    loading,
    refresh,
    refreshPrices,
    refreshSinglePrice,
    addItem,
    updateItem,
    removeItem,
  } = useWatchlist(activeTab);

  const { config: strategy } = useStrategy();

  const {
    executeTrade,
    balance,
    getHeldQty,
  } = usePaperTrading();

  const [filterQuery, setFilterQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!filterQuery.trim()) return items;
    const q = filterQuery.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.tradingSymbol && item.tradingSymbol.toLowerCase().includes(q))
    );
  }, [items, filterQuery]);

  const [formVisible, setFormVisible] =
    useState(false);

  const [editing, setEditing] =
    useState<WatchlistItem | null>(null);

  const [tradeItem, setTradeItem] =
    useState<WatchlistItem | null>(null);

  const [chartItem, setChartItem] =
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

  const handleSelectTab = async (tab: string) => {
    setActiveTab(tab);
    await saveActiveWatchlistTab(tab);
  };

  const handleCreateTab = async () => {
    const name = newTabName.trim();
    if (!name) return;
    if (tabs.includes(name)) {
      showMsg('error', 'Error', 'Tab already exists.');
      return;
    }
    const nextTabs = [...tabs, name];
    setTabs(nextTabs);
    await saveWatchlistTabs(nextTabs);
    setActiveTab(name);
    await saveActiveWatchlistTab(name);
    setNewTabName('');
    setNewTabVisible(false);
  };

  const handleDeleteTab = async () => {
    if (activeTab === 'Default') return;
    try {
      for (const item of items) {
        await removeItem(item.id);
      }
      const nextTabs = tabs.filter((t) => t !== activeTab);
      setTabs(nextTabs);
      await saveWatchlistTabs(nextTabs);
      setActiveTab('Default');
      await saveActiveWatchlistTab('Default');
    } catch (err) {
      console.error('Failed to delete tab', err);
      showMsg('error', 'Error', 'Failed to delete watchlist tab.');
    }
  };

  useEffect(() => {
    loadApiUrl().then(setApiBase);
    Promise.all([loadWatchlistTabs(), loadActiveWatchlistTab()]).then(([t, a]) => {
      setTabs(t);
      if (t.includes(a)) {
        setActiveTab(a);
      } else {
        setActiveTab(t[0] || 'Default');
      }
    });
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

  const handleOpenChart = (
    item: WatchlistItem
  ) => {
    setChartItem(item);
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

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          style={styles.tabsContainer}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
              onPress={() => handleSelectTab(tab)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab && styles.activeTabButtonText,
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.addTabButton}
            onPress={() => setNewTabVisible(true)}
            hitSlop={8}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
          </Pressable>
        </ScrollView>

        {activeTab !== 'Default' && (
          <Pressable
            style={styles.deleteTabButton}
            onPress={() => setDeleteTabVisible(true)}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={18} color={colors.sell} />
          </Pressable>
        )}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>
          Watchlist
        </Text>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.refreshBtn}
            onPress={refreshPrices}
            disabled={loading}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={loading ? colors.textMuted : colors.primary}
            />
          </Pressable>

          <Pressable
            style={styles.addBtn}
            onPress={openAdd}
          >
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
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
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={filterQuery}
              onChangeText={setFilterQuery}
              placeholder="Filter watchlist..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {filterQuery.length > 0 && (
              <Pressable onPress={() => setFilterQuery('')} hitSlop={8} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {filteredItems.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="search-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>
                No matches found
              </Text>
              <Text style={styles.emptyText}>
                Try searching for a different symbol
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredItems}
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
                  onRefreshPrice={() =>
                    refreshSinglePrice(item.id)
                  }
                />
              )}
            />
          )}
        </>
      )}

      <WatchlistFormModal
        visible={formVisible}
        editing={editing}
        onClose={() =>
          setFormVisible(false)
        }
        onSave={handleSave}
      />

      <TradingViewModal
        visible={chartItem != null}
        item={chartItem}
        onClose={() => setChartItem(null)}
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

      {/* Tab Creation Modal */}
      <Modal
        visible={newTabVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNewTabVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.tabModalContent}>
            <Text style={styles.modalTitle}>New Watchlist Tab</Text>
            <TextInput
              style={styles.tabInput}
              value={newTabName}
              onChangeText={setNewTabName}
              placeholder="Enter tab title (e.g. Nifty, Options)..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  setNewTabVisible(false);
                  setNewTabName('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.createBtn} onPress={handleCreateTab}>
                <Text style={styles.createBtnText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tab Deletion Confirm Dialog */}
      <ConfirmDialog
        visible={deleteTabVisible}
        title="Delete Watchlist Tab"
        message={`Are you sure you want to delete the "${activeTab}" watchlist tab and all of its items?`}
        onCancel={() => setDeleteTabVisible(false)}
        onConfirm={async () => {
          setDeleteTabVisible(false);
          await handleDeleteTab();
        }}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refreshBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
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
    paddingBottom: 100,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    height: '100%',
  },
  clearBtn: {
    padding: spacing.xs,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  tabsContainer: {
    flex: 1,
  },
  tabsContent: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  tabButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 30,
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  addTabButton: {
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: 30,
    backgroundColor: colors.surface,
  },
  deleteTabButton: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  tabModalContent: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  tabInput: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});