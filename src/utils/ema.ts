import type { SignalType } from '../types';

export function calculateEMA(values: number[], period: number): (number | null)[] {
  if (values.length === 0 || period < 1) return [];
  const k = 2 / (period + 1);
  const result: (number | null)[] = [];

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      sum += values[i];
      result.push(null);
      continue;
    }
    if (i === period - 1) {
      sum += values[i];
      const sma = sum / period;
      result.push(sma);
      continue;
    }
    const prev = result[i - 1]!;
    result.push(values[i] * k + prev * (1 - k));
  }
  return result;
}

export function getEMASignal(
  fastEma: (number | null)[],
  slowEma: (number | null)[]
): SignalType {
  const len = Math.min(fastEma.length, slowEma.length);
  if (len < 2) return 'hold';

  let prevFast: number | null = null;
  let prevSlow: number | null = null;
  let currFast: number | null = null;
  let currSlow: number | null = null;

  for (let i = len - 2; i < len; i++) {
    if (fastEma[i] != null && slowEma[i] != null) {
      if (i === len - 2) {
        prevFast = fastEma[i];
        prevSlow = slowEma[i];
      } else {
        currFast = fastEma[i];
        currSlow = slowEma[i];
      }
    }
  }

  if (prevFast == null || prevSlow == null || currFast == null || currSlow == null) {
    return 'hold';
  }

  const wasBelow = prevFast <= prevSlow;
  const isAbove = currFast > currSlow;
  const wasAbove = prevFast >= prevSlow;
  const isBelow = currFast < currSlow;

  if (wasBelow && isAbove) return 'buy';
  if (wasAbove && isBelow) return 'sell';
  if (currFast > currSlow) return 'buy';
  if (currFast < currSlow) return 'hold';
  return 'hold';
}
