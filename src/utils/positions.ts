import type { PaperTrade, Position } from '../types';

export function computePositions(trades: PaperTrade[]): Position[] {
  const ledger: Record<string, { qty: number; cost: number; name: string }> = {};

  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  for (const t of sorted) {
    if (!ledger[t.symbol]) {
      ledger[t.symbol] = { qty: 0, cost: 0, name: t.name };
    }
    const row = ledger[t.symbol];
    row.name = t.name;

    if (t.side === 'buy') {
      row.cost += t.price * t.quantity;
      row.qty += t.quantity;
    } else {
      const avg = row.qty > 0 ? row.cost / row.qty : 0;
      row.cost -= avg * Math.min(t.quantity, row.qty);
      row.qty -= t.quantity;
      if (row.qty <= 0) {
        row.qty = 0;
        row.cost = 0;
      }
    }
  }

  return Object.entries(ledger)
    .filter(([, row]) => row.qty > 0)
    .map(([symbol, row]) => {
      const currentPrice = 0;
      const avgCost = row.cost / row.qty;
      const costBasis = avgCost * row.qty;
      const marketValue = currentPrice * row.qty;
      const unrealizedPnL = marketValue - costBasis;
      const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

      return {
        symbol,
        name: row.name,
        quantity: row.qty,
        avgCost,
        currentPrice,
        marketValue,
        costBasis,
        unrealizedPnL,
        unrealizedPnLPercent,
      };
    })
    .sort((a, b) => b.marketValue - a.marketValue);
}

export function getHeldQuantity(trades: PaperTrade[], symbol: string): number {
  return computePositions(trades)
    .filter((p) => p.symbol === symbol)
    .reduce((sum, p) => sum + p.quantity, 0);
}
