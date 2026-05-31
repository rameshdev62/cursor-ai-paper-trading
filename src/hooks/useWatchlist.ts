import { useCallback, useEffect, useState } from 'react';
import type {
  WatchlistEntryInput,
  WatchlistItem,
} from '../types';
import {
  loadWatchlist,
  saveWatchlist,
} from '../utils/storage';

function makeId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function entryKey(
  entry: Pick<
    WatchlistEntryInput,
    'token' | 'symbol' | 'tradingSymbol'
  >
) {
  if (entry.token) {
    return `token:${entry.token}`;
  }

  return `sym:${(
    entry.tradingSymbol ?? entry.symbol
  ).toUpperCase()}`;
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await loadWatchlist();
      setItems(data);
    } catch (error) {
      console.error('Failed to load watchlist', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persist = useCallback(
    async (next: WatchlistItem[]) => {
      await saveWatchlist(next);
      setItems(next);
    },
    []
  );

  const addItem = useCallback(
    async (entry: WatchlistEntryInput) => {
      const symbol = entry.symbol.trim().toUpperCase();
      const tradingSymbol =
        entry.tradingSymbol?.trim();

      if (!symbol && !tradingSymbol) {
        return false;
      }

      const key = entryKey(entry);

      if (items.some((i) => entryKey(i) === key)) {
        return false;
      }

      const next: WatchlistItem[] = [
        ...items,
        {
          id: makeId(),
          symbol: tradingSymbol ?? symbol,
          tradingSymbol:
            tradingSymbol ?? symbol,
          name:
            entry.name.trim() ||
            entry.symbol.trim() ||
            symbol,
          token: entry.token,
          exchange:
            entry.exchange ?? 'NFO',
          addedAt: Date.now(),
        },
      ];

      await persist(next);
      return true;
    },
    [items, persist]
  );

  const updateItem = useCallback(
    async (
      id: string,
      entry: WatchlistEntryInput
    ) => {
      const symbol = entry.symbol.trim().toUpperCase();
      const tradingSymbol =
        entry.tradingSymbol?.trim();

      if (!symbol && !tradingSymbol) {
        return false;
      }

      const key = entryKey(entry);

      if (
        items.some(
          (i) =>
            i.id !== id &&
            entryKey(i) === key
        )
      ) {
        return false;
      }

      const next = items.map((item) =>
        item.id === id
          ? {
              ...item,
              symbol:
                tradingSymbol ?? symbol,
              tradingSymbol:
                tradingSymbol ?? symbol,
              name:
                entry.name.trim() ||
                entry.symbol.trim() ||
                symbol,
              token: entry.token,
              exchange:
                entry.exchange ??
                item.exchange,
            }
          : item
      );

      await persist(next);
      return true;
    },
    [items, persist]
  );

  const removeItem = useCallback(
    async (id: string) => {
      console.log('REMOVE ITEM CALLED', id);
  
      const next = items.filter((item) => item.id !== id);
  
      console.log('Before:', items.length);
      console.log('After:', next.length);
  
      setItems(next);
  
      try {
        await saveWatchlist(next);
      } catch (err) {
        console.error('Failed to save watchlist', err);
      }
    },
    [items]
  );

  return {
    items,
    loading,
    refresh,
    addItem,
    updateItem,
    removeItem,
  };
}