import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WatchlistEntryInput, WatchlistItem } from '../types';
import {
  formatSymbolLabel,
  loadNfoSymbols,
  loadNseSymbols,
  loadNfoSymbolsFromPath,
  loadNseSymbolsFromPath,
  clearCatalogCache,
  searchSymbols,
  searchOptionByStrike,
  parseOptionSearch,
  type CatalogSymbol,
} from '../utils/symbolCatalog';
import { loadEquityCsvPath, loadNfoCsvPath } from '../utils/storage';
import { colors, radius, spacing } from '../theme/colors';

function parseExpiry(expiry?: string): Date | null {
  if (!expiry) return null;
  const cleaned = expiry.replace(/[^0-9A-Z]/gi, '').toUpperCase();

  const ddMmmYY = cleaned.match(/^(\d{2})([A-Z]{3})(\d{2,4})$/);
  if (ddMmmYY) {
    const months: Record<string, number> = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
    };
    const day = parseInt(ddMmmYY[1], 10);
    const month = months[ddMmmYY[2]] ?? 0;
    const year = ddMmmYY[3].length === 2 ? 2000 + parseInt(ddMmmYY[3], 10) : parseInt(ddMmmYY[3], 10);
    return new Date(year, month, day);
  }

  const yyyymmdd = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (yyyymmdd) {
    return new Date(parseInt(yyyymmdd[1], 10), parseInt(yyyymmdd[2], 10) - 1, parseInt(yyyymmdd[3], 10));
  }

  return null;
}

type Props = {
  visible: boolean;
  editing: WatchlistItem | null;
  onClose: () => void;
  onSave: (entry: WatchlistEntryInput) => Promise<boolean>;
};

function catalogRowToSelected(editing: WatchlistItem): CatalogSymbol {
  return {
    exchange: editing.exchange ?? 'NFO',
    token: editing.token ?? '',
    lotSize: '',
    symbol: editing.symbol,
    tradingSymbol: editing.tradingSymbol ?? editing.symbol,
    optionType: editing.optionType,
    strikePrice: editing.strikePrice,
    expiry: editing.expiry,
  };
}

function SuggestionSection({
  title,
  items,
  selected,
  onPick,
}: {
  title: string;
  items: CatalogSymbol[];
  selected: CatalogSymbol | null;
  onPick: (row: CatalogSymbol) => void;
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <Pressable
          key={`${item.exchange}-${item.token}-${item.tradingSymbol}`}
          style={({ pressed }) => [
            styles.suggestionRow,
            pressed && styles.suggestionRowPressed,
            selected?.token === item.token &&
              selected.tradingSymbol === item.tradingSymbol &&
              selected.exchange === item.exchange &&
              styles.suggestionRowSelected,
          ]}
          onPress={() => onPick(item)}
        >
          <Text style={styles.suggestionName}>{item.symbol}</Text>
          <Text style={styles.suggestionMeta} numberOfLines={1}>
            {formatSymbolLabel(item)}
          </Text>
          <Text style={styles.suggestionToken}>
            {item.exchange} · token {item.token}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function WatchlistFormModal({ visible, editing, onClose, onSave }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CatalogSymbol | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [nfoCatalog, setNfoCatalog] = useState<CatalogSymbol[]>([]);
  const [nseCatalog, setNseCatalog] = useState<CatalogSymbol[]>([]);

  useEffect(() => {
    if (!visible) return;

    setQuery(editing?.name ?? editing?.symbol ?? '');
    setSelected(editing?.token ? catalogRowToSelected(editing) : null);
    setError('');
    setCatalogError('');

    let cancelled = false;
    setCatalogLoading(true);

    const loadCatalogs = async () => {
      const [equityPath, nfoPath] = await Promise.all([
        loadEquityCsvPath(),
        loadNfoCsvPath(),
      ]);

      if (equityPath || nfoPath) {
        clearCatalogCache();
      }

      const nse = equityPath
        ? await loadNseSymbolsFromPath(equityPath)
        : await loadNseSymbols();
      const nfo = nfoPath
        ? await loadNfoSymbolsFromPath(nfoPath)
        : await loadNfoSymbols();
      return [nfo, nse] as const;
    };

    loadCatalogs()
      .then(([nfo, nse]) => {
        if (cancelled) return;
        setNfoCatalog(nfo);
        setNseCatalog(nse);
      })
      .catch((err) => {
        if (!cancelled) {
          setCatalogError(String(err?.message ?? err));
        }
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, editing]);

  const nseSuggestions = useMemo(() => {
    if (!nseCatalog.length || query.trim().length < 1) return [];
    return searchSymbols(nseCatalog, query, 12);
  }, [nseCatalog, query]);

  const nfoSuggestions = useMemo(() => {
    if (!nfoCatalog.length || query.trim().length < 1) return [];
    
    const optionQuery = parseOptionSearch(query);
    let results: CatalogSymbol[];
    if (optionQuery) {
      results = searchOptionByStrike(
        nfoCatalog,
        optionQuery.underlying,
        optionQuery.strike,
        optionQuery.optionType
      );
    } else {
      results = searchSymbols(nfoCatalog, query, 50);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return results
      .filter((r) => {
        const d = parseExpiry(r.expiry);
        return !d || d.getTime() >= today.getTime();
      })
      .sort((a, b) => {
        const aDate = parseExpiry(a.expiry);
        const bDate = parseExpiry(b.expiry);
        const aIsCurrent = aDate && aDate.getMonth() === currentMonth && aDate.getFullYear() === currentYear;
        const bIsCurrent = bDate && bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;
        if (aIsCurrent && !bIsCurrent) return -1;
        if (!aIsCurrent && bIsCurrent) return 1;
        return (aDate?.getTime() ?? Infinity) - (bDate?.getTime() ?? Infinity);
      })
      .slice(0, 12);
  }, [nfoCatalog, query]);

  const hasResults = nseSuggestions.length > 0 || nfoSuggestions.length > 0;

  const pickRow = (row: CatalogSymbol) => {
    setSelected(row);
    setQuery(row.symbol);
    setError('');
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    console.log("selected",selected);
    const entry: WatchlistEntryInput = selected
      ? {
          symbol: selected.symbol,
          name: selected.symbol,
          token: selected.token,
          exchange: selected.exchange,
          tradingSymbol: selected.tradingSymbol,
        }
      : {
          symbol: query.trim().toUpperCase(),
          name: query.trim(),
          exchange: 'NSE',
        };

    if (!entry.symbol && !entry.tradingSymbol) {
      setSaving(false);
      setError('Search and select a symbol from NSE or NFO list.');
      return;
    }

    const ok = await onSave(entry);
    setSaving(false);
    if (ok) onClose();
    else {
      setError(
        editing ? 'Could not update — symbol may already exist' : 'Symbol already in watchlist'
      );
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{editing ? 'Edit symbol' : 'Add to watchlist'}</Text>
          <Text style={styles.hint}>Search NSE and NFO symbols by name</Text>

          <Text style={styles.label}>Search by name</Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setSelected(null);
              setError('');
            }}
            placeholder="e.g. NIFTY, RELIANCE, NIFTY 25000 CE"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            editable={!saving}
          />

          {catalogLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.loadingText}>Loading NSE & NFO symbols…</Text>
            </View>
          )}

          {catalogError ? <Text style={styles.error}>{catalogError}</Text> : null}

          {!catalogLoading && (nseCatalog.length > 0 || nfoCatalog.length > 0) && (
            <Text style={styles.catalogReady}>
              {nseCatalog.length.toLocaleString()} Equity · {nfoCatalog.length.toLocaleString()} NFO
              symbols loaded
            </Text>
          )}

          {!catalogLoading && query.trim().length > 0 && hasResults && (
            <ScrollView
              style={styles.suggestionsBox}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              <SuggestionSection
                title=""
                items={nseSuggestions}
                selected={selected}
                onPick={pickRow}
              />
              <SuggestionSection
                title="NFO"
                items={nfoSuggestions}
                selected={selected}
                onPick={pickRow}
              />
            </ScrollView>
          )}

          {!catalogLoading &&
            (nseCatalog.length > 0 || nfoCatalog.length > 0) &&
            query.trim().length > 0 &&
            !hasResults && (
              <Text style={styles.noMatches}>No symbols matching "{query.trim()}"</Text>
            )}

          {selected && (
            <View style={styles.selectedBox}>
              <Ionicons name="checkmark-circle" size={18} color={colors.buy} />
              <View style={styles.selectedTextWrap}>
                <Text style={styles.selectedTitle}>
                  {selected.symbol} ({selected.exchange})
                </Text>
                <Text style={styles.selectedSub} numberOfLines={2}>
                  {formatSymbolLabel(selected)}
                </Text>
              </View>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={submit} disabled={saving || catalogLoading}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveText}>{editing ? 'Update' : 'Add'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  catalogReady: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  noMatches: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  suggestionsBox: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    maxHeight: 280,
  },
  section: {
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  suggestionRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestionRowPressed: {
    backgroundColor: colors.primaryDark + '22',
  },
  suggestionRowSelected: {
    backgroundColor: colors.primaryDark + '33',
  },
  suggestionName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  suggestionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  suggestionToken: {
    color: colors.primary,
    fontSize: 11,
    marginTop: 4,
  },
  selectedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.buyMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.buy,
  },
  selectedTextWrap: {
    flex: 1,
  },
  selectedTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  selectedSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  error: {
    color: colors.sell,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDark,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
});
