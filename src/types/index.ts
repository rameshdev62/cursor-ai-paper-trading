export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  addedAt: number;
  token?: string;
  exchange?: string;
  tradingSymbol?: string;
  optionType?: string;
  strikePrice?: string;
  expiry?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  priceUpdatedAt?: number;
}

export type WatchlistEntryInput = {
  symbol: string;
  name: string;
  token?: string;
  exchange?: string;
  tradingSymbol?: string;
};

export interface PaperTrade {
  id: string;
  symbol: string;
  name: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
}

export interface Position {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface EMAStrategyConfig {
  fastPeriod: number;
  slowPeriod: number;
}

export type SignalType = 'buy' | 'sell' | 'hold';

export interface PricePoint {
  date: string;
  close: number;
}

export interface CandlePoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface EmaLinePoint {
  time: string;
  value: number;
}

export interface TradingViewChartData {
  candles: CandlePoint[];
  fastEma: EmaLinePoint[];
  slowEma: EmaLinePoint[];
  fastPeriod: number;
  slowPeriod: number;
  signal: SignalType;
  lastPrice: number;
}

export interface ChartSeries {
  prices: PricePoint[];
  fastEma: (number | null)[];
  slowEma: (number | null)[];
  signal: SignalType;
}
