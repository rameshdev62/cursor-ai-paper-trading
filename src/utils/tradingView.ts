import { Alert, Linking } from 'react-native';
import type { WatchlistItem } from '../types';

function normalizeTradingViewSymbol(item: WatchlistItem): string {
  const exchange = (item.exchange ?? 'NSE').toUpperCase();
  let trading = (item.tradingSymbol ?? item.symbol).trim();

  if (trading.endsWith(' INDEX')) {
    trading = trading.replace(' INDEX', '');
  }
  if (trading.endsWith('-EQ')) {
    trading = trading.replace('-EQ', '');
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
