import { useCallback, useEffect, useState } from 'react';
import type { WatchlistItem } from '../types';
import { loadWatchlist, saveWatchlist } from '../utils/storage';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await loadWatchlist();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persist = useCallback(async (next: WatchlistItem[]) => {
    setItems(next);
    await saveWatchlist(next);
  }, []);

  const addItem = useCallback(
    async (symbol: string, name: string) => {
      const upper = symbol.trim().toUpperCase();
      if (!upper) return false;
      if (items.some((i) => i.symbol === upper)) return false;
      const next: WatchlistItem[] = [
        ...items,
        { id: makeId(), symbol: upper, name: name.trim() || upper, addedAt: Date.now() },
      ];
      await persist(next);
      return true;
    },
    [items, persist]
  );

  const updateItem = useCallback(
    async (id: string, symbol: string, name: string) => {
      const upper = symbol.trim().toUpperCase();
      if (!upper) return false;
      if (items.some((i) => i.symbol === upper && i.id !== id)) return false;
      const next = items.map((i) =>
        i.id === id ? { ...i, symbol: upper, name: name.trim() || upper } : i
      );
      await persist(next);
      return true;
    },
    [items, persist]
  );

  const removeItem = useCallback(
    async (id: string) => {
      const next = items.filter((i) => i.id !== id);
      await persist(next);
    },
    [items, persist]
  );

  return { items, loading, refresh, addItem, updateItem, removeItem };
}
