import type {
  ChartSeries,
  CandlePoint,
  PricePoint,
  TradingViewChartData,
} from '../types';
import { calculateEMA, getEMASignal } from './ema';

function hashSymbol(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) {
    h = (h << 5) - h + symbol.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function generatePriceHistory(symbol: string, days = 60): PricePoint[] {
  const seed = hashSymbol(symbol);
  const base = 50 + (seed % 200);
  const points: PricePoint[] = [];
  let price = base;

  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const noise =
      Math.sin((seed + i) * 0.7) * 2 +
      Math.cos((seed + i) * 0.3) * 1.5 +
      (Math.random() - 0.5) * 1.2;
    price = Math.max(5, price + noise);
    points.push({
      date: d.toISOString().slice(0, 10),
      close: Math.round(price * 100) / 100,
    });
  }
  return points;
}

export function generateOHLC(symbol: string, days = 60): CandlePoint[] {
  const prices = generatePriceHistory(symbol, days);
  return prices.map((p, i) => {
    const close = p.close;
    const prevClose = i > 0 ? prices[i - 1].close : close;
    const open = Math.round(((prevClose + close) / 2) * 100) / 100;
    const spread = Math.abs(close - prevClose) * 0.6 + 0.4;
    const high = Math.round((Math.max(open, close) + spread) * 100) / 100;
    const low = Math.round((Math.min(open, close) - spread) * 100) / 100;
    return { time: p.date, open, high, low, close };
  });
}

export function buildChartSeries(
  symbol: string,
  fastPeriod: number,
  slowPeriod: number
): ChartSeries {
  const prices = generatePriceHistory(symbol);
  const closes = prices.map((p) => p.close);
  const fastEma = calculateEMA(closes, fastPeriod);
  const slowEma = calculateEMA(closes, slowPeriod);
  const signal = getEMASignal(fastEma, slowEma);

  return { prices, fastEma, slowEma, signal };
}

export function buildTradingViewChartData(
  symbol: string,
  fastPeriod: number,
  slowPeriod: number
): TradingViewChartData {
  const series = buildChartSeries(symbol, fastPeriod, slowPeriod);
  const candles = generateOHLC(symbol);
  const fastEma: TradingViewChartData['fastEma'] = [];
  const slowEma: TradingViewChartData['slowEma'] = [];

  series.prices.forEach((p, i) => {
    if (series.fastEma[i] != null) {
      fastEma.push({ time: p.date, value: series.fastEma[i]! });
    }
    if (series.slowEma[i] != null) {
      slowEma.push({ time: p.date, value: series.slowEma[i]! });
    }
  });

  return {
    candles,
    fastEma,
    slowEma,
    fastPeriod,
    slowPeriod,
    signal: series.signal,
    lastPrice: series.prices[series.prices.length - 1]?.close ?? 0,
  };
}

/** Maps app symbols to TradingView widget exchange prefixes */
export function getTradingViewSymbol(symbol: string): string | null {
  const map: Record<string, string> = {
    AAPL: 'NASDAQ:AAPL',
    MSFT: 'NASDAQ:MSFT',
    GOOGL: 'NASDAQ:GOOGL',
    AMZN: 'NASDAQ:AMZN',
    TSLA: 'NASDAQ:TSLA',
    NVDA: 'NASDAQ:NVDA',
    META: 'NASDAQ:META',
    BTC: 'BINANCE:BTCUSDT',
    ETH: 'BINANCE:ETHUSDT',
  };
  return map[symbol.toUpperCase()] ?? null;
}

export function getLatestPrice(symbol: string): number {
  const history = generatePriceHistory(symbol, 5);
  return history[history.length - 1].close;
}

export const POPULAR_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'BTC', name: 'Bitcoin (sim)' },
  { symbol: 'ETH', name: 'Ethereum (sim)' },
];
