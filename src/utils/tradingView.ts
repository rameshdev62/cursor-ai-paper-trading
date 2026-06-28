import { Alert, Linking } from 'react-native';
import type { WatchlistItem } from '../types';

const MONTH_MAP: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04',
  MAY: '05', JUN: '06', JUL: '07', AUG: '08',
  SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

function expiryToYYMMDD(expiry: string): string {
  const cleaned = expiry.replace(/[^0-9A-Z]/gi, '').toUpperCase();

  const ddMmmYY = cleaned.match(/^(\d{2})([A-Z]{3})(\d{2,4})$/);
  if (ddMmmYY) {
    const day = ddMmmYY[1];
    const month = MONTH_MAP[ddMmmYY[2]] ?? '00';
    const year = ddMmmYY[3].slice(-2);
    return year + month + day;
  }

  const mmmDDYY = cleaned.match(/^([A-Z]{3})(\d{2})(\d{2,4})$/);
  if (mmmDDYY) {
    const month = MONTH_MAP[mmmDDYY[1]] ?? '00';
    const day = mmmDDYY[2];
    const year = mmmDDYY[3].slice(-2);
    return year + month + day;
  }

  const yyyymmdd = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (yyyymmdd) {
    return yyyymmdd[1].slice(-2) + yyyymmdd[2] + yyyymmdd[3];
  }

  const yymmdd = cleaned.match(/^(\d{6})$/);
  if (yymmdd) {
    return yymmdd[1];
  }

  return cleaned;
}

function parseSymbolParts(symbol: string): {
  underlying: string;
  expiry: string;
  strike: string;
  optType: string;
} | null {
  const upper = symbol.toUpperCase();

  const match = upper.match(
    /^([A-Z]+?)(\d{2}[A-Z]{3}\d{2,4}?)(C|P|CE|PE)(\d+)$/i
  );
  if (match) {
    return {
      underlying: match[1],
      expiry: expiryToYYMMDD(match[2]),
      strike: match[4],
      optType: match[3].toUpperCase() === 'C' || match[3].toUpperCase() === 'CE' ? 'C' : 'P',
    };
  }

  const matchSimple = upper.match(
    /^([A-Z]+?)(\d{2,4}?)(C|P|CE|PE)(\d+)$/i
  );
  if (matchSimple) {
    return {
      underlying: matchSimple[1],
      expiry: '',
      strike: matchSimple[4],
      optType: matchSimple[3],
    };
  }

  return null;
}

const INDEX_SYMBOL_MAP: Record<string, string> = {
  'NIFTY BANK': 'BANKNIFTY',
  'NIFTY 50': 'NIFTY',
};

function normalizeTradingViewSymbol(item: WatchlistItem): string {
  const exchange = (item.exchange ?? 'NSE').toUpperCase();
  const raw = (item.tradingSymbol ?? item.symbol).trim();
  let trading = raw.toUpperCase();

  if (trading.endsWith(' INDEX')) {
    trading = trading.replace(' INDEX', '');
  }
  if (trading.endsWith('-EQ')) {
    trading = trading.replace('-EQ', '');
  }

  const mapped = INDEX_SYMBOL_MAP[trading];
  if (mapped) trading = mapped;

  if (exchange === 'NFO') {
    const parsed = parseSymbolParts(trading);

    if (parsed) {
      return `${parsed.underlying}${parsed.expiry}${parsed.optType}${parsed.strike}`;
    }
    if (item?.optionType && item?.strikePrice) {
      const optType =
        item.optionType === 'CE' || item.optionType === 'C'
          ? 'C'
          : 'P';
      const expiry = item.expiry
        ? expiryToYYMMDD(item.expiry)
        : '';
      const underlying = trading.replace(/\d+.*$/, '');
      return `${underlying}${expiry}${optType}${item.strikePrice}`;
    }
  
    return trading;
  }

  return `${exchange}:${trading}`;
}

export function getTradingViewChartUrl(item: WatchlistItem): string {
  const tvSymbol = normalizeTradingViewSymbol(item);
  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;
}

export async function openTradingViewChart(item: WatchlistItem): Promise<boolean> {
  const chartUrl = getTradingViewChartUrl(item);

  try {
    const canOpen = await Linking.canOpenURL(chartUrl);
    if (!canOpen) {
      Alert.alert('Unable to open chart', 'No browser is available on this device.');
      return false;
    }

    await Linking.openURL(chartUrl);
    return true;
  } catch {
    Alert.alert('Unable to open chart', 'Please try again in a moment.');
    return false;
  }
}
