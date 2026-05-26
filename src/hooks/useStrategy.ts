import { useCallback, useEffect, useState } from 'react';
import type { EMAStrategyConfig } from '../types';
import { DEFAULT_STRATEGY, loadStrategy, saveStrategy } from '../utils/storage';

export function useStrategy() {
  const [config, setConfig] = useState<EMAStrategyConfig>(DEFAULT_STRATEGY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await loadStrategy();
    setConfig(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateConfig = useCallback(async (next: EMAStrategyConfig) => {
    if (next.fastPeriod >= next.slowPeriod) return false;
    if (next.fastPeriod < 2 || next.slowPeriod < 3) return false;
    setConfig(next);
    await saveStrategy(next);
    return true;
  }, []);

  return { config, loading, updateConfig, refresh };
}
