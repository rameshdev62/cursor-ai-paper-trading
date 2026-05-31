import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { PaperTrade, Position } from '../types';
import {
  DEFAULT_BALANCE,
  loadBalance,
  loadTrades,
  saveBalance,
  saveTrades,
} from '../utils/storage';
import { computePositions, getHeldQuantity } from '../utils/positions';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type TradeResult = { ok: boolean; message?: string };

type PaperTradingContextValue = {
  trades: PaperTrade[];
  balance: number;
  positions: Position[];
  loading: boolean;
  refresh: () => Promise<void>;
  executeTrade: (
    symbol: string,
    name: string,
    side: 'buy' | 'sell',
    quantity: number
  ) => Promise<TradeResult>;
  getPosition: (symbol: string) => Position | undefined;
  getHeldQty: (symbol: string) => number;
  portfolioValue: number;
};

const PaperTradingContext = createContext<PaperTradingContextValue | null>(null);

export function PaperTradingProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [balance, setBalance] = useState(DEFAULT_BALANCE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [t, b] = await Promise.all([loadTrades(), loadBalance()]);
    setTrades(t);
    setBalance(b);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const positions = useMemo(() => computePositions(trades), [trades]);

  const portfolioValue = useMemo(() => {
    const positionsValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
    return balance + positionsValue;
  }, [balance, positions]);

  const getPosition = useCallback(
    (symbol: string) => positions.find((p) => p.symbol === symbol),
    [positions]
  );

  const getHeldQty = useCallback(
    (symbol: string) => getHeldQuantity(trades, symbol),
    [trades]
  );

  const executeTrade = useCallback(
    async (
      symbol: string,
      name: string,
      side: 'buy' | 'sell',
      quantity: number
    ): Promise<TradeResult> => {
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return { ok: false, message: 'Quantity must be a positive number' };
      }
      if (!Number.isInteger(quantity)) {
        return { ok: false, message: 'Whole shares only' };
      }

      const price = 0;
      const total = price * quantity;

      if (side === 'buy') {
        if (total > balance) {
          return { ok: false, message: 'Insufficient paper balance' };
        }
      } else {
        const held = getHeldQuantity(trades, symbol);
        if (held <= 0) {
          return { ok: false, message: `No ${symbol} position to sell` };
        }
        if (quantity > held) {
          return {
            ok: false,
            message: `You only hold ${held} share${held === 1 ? '' : 's'} of ${symbol}`,
          };
        }
      }

      const nextTrade: PaperTrade = {
        id: makeId(),
        symbol,
        name,
        side,
        quantity,
        price,
        timestamp: Date.now(),
      };

      const nextTrades = [nextTrade, ...trades];
      const nextBalance = side === 'buy' ? balance - total : balance + total;

      setTrades(nextTrades);
      setBalance(nextBalance);
      await Promise.all([saveTrades(nextTrades), saveBalance(nextBalance)]);
      return { ok: true };
    },
    [balance, trades]
  );

  const value = useMemo(
    () => ({
      trades,
      balance,
      positions,
      loading,
      refresh,
      executeTrade,
      getPosition,
      getHeldQty,
      portfolioValue,
    }),
    [
      trades,
      balance,
      positions,
      loading,
      refresh,
      executeTrade,
      getPosition,
      getHeldQty,
      portfolioValue,
    ]
  );

  return (
    <PaperTradingContext.Provider value={value}>{children}</PaperTradingContext.Provider>
  );
}

export function usePaperTrading() {
  const ctx = useContext(PaperTradingContext);
  if (!ctx) {
    throw new Error('usePaperTrading must be used within PaperTradingProvider');
  }
  return ctx;
}
