import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EMAStrategyConfig, PaperTrade, WatchlistItem } from '../types';

const KEYS = {
  watchlist: '@papertrade/watchlist',
  trades: '@papertrade/trades',
  strategy: '@papertrade/strategy',
  balance: '@papertrade/balance',
};

export const DEFAULT_BALANCE = 100_000;
export const DEFAULT_STRATEGY: EMAStrategyConfig = {
  fastPeriod: 9,
  slowPeriod: 21,
};

export async function loadWatchlist(): Promise<WatchlistItem[]> {
  const raw = await AsyncStorage.getItem(KEYS.watchlist);
  return raw ? JSON.parse(raw) : [];
}

export async function saveWatchlist(items: WatchlistItem[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.watchlist, JSON.stringify(items));
}

export async function loadTrades(): Promise<PaperTrade[]> {
  const raw = await AsyncStorage.getItem(KEYS.trades);
  return raw ? JSON.parse(raw) : [];
}

export async function saveTrades(trades: PaperTrade[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.trades, JSON.stringify(trades));
}

export async function loadStrategy(): Promise<EMAStrategyConfig> {
  const raw = await AsyncStorage.getItem(KEYS.strategy);
  return raw ? JSON.parse(raw) : DEFAULT_STRATEGY;
}

export async function saveStrategy(config: EMAStrategyConfig): Promise<void> {
  await AsyncStorage.setItem(KEYS.strategy, JSON.stringify(config));
}

export async function loadBalance(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.balance);
  return raw != null ? Number(raw) : DEFAULT_BALANCE;
}

export async function saveBalance(balance: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.balance, String(balance));
}
