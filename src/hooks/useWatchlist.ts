import { useCallback, useEffect, useState } from 'react';
import type { WatchlistEntryInput, WatchlistItem } from '../types';
import {
  fetchWatchlist,
  addToWatchlist,
  updateWatchlistItem,
  deleteWatchlistItem,
  type ApiWatchlistItem,
} from '../utils/api';

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

function mapApiItem(item: ApiWatchlistItem): WatchlistItem {
  const parsed = parseOptionFromSymbol(item.symbol);
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
  };
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchWatchlist();
      setItems(data.map(mapApiItem));
    } catch (error) {
      console.error('Failed to load watchlist', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (entry: WatchlistEntryInput) => {
      const symbol = (entry.tradingSymbol ?? entry.symbol).trim().toUpperCase();
      if (!symbol) return false;

      try {
        await addToWatchlist(symbol, entry.exchange ?? 'NSE', entry.token);
        await refresh();
        return true;
      } catch {
        return false;
      }
    },
    [refresh]
  );

  const updateItem = useCallback(
    async (id: string, entry: WatchlistEntryInput) => {
      const symbol = (entry.tradingSymbol ?? entry.symbol).trim().toUpperCase();
      if (!symbol) return false;

      try {
        await updateWatchlistItem(Number(id), {
          symbol,
          exchange: entry.exchange,
          token: entry.token,
        });
        await refresh();
        return true;
      } catch {
        return false;
      }
    },
    [refresh]
  );

  const removeItem = useCallback(
    async (id: string) => {
      try {
        await deleteWatchlistItem(Number(id));
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        console.error('Failed to delete watchlist item', err);
      }
    },
    []
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
