import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchStockMaster, loadCachedStockMaster } from '../utils/stockMaster';

const StockMasterContext = createContext(null);

export function StockMasterProvider({ children }) {
  const cached = loadCachedStockMaster();
  const [stocks, setStocks] = useState(cached?.stocks ?? []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stale, setStale] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStockMaster();
      setStocks(result.stocks);
      setStale(result.stale);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StockMasterContext.Provider value={{ stocks, loading, error, stale, reload }}>
      {children}
    </StockMasterContext.Provider>
  );
}

export function useStockMaster() {
  const ctx = useContext(StockMasterContext);
  if (!ctx) throw new Error('useStockMaster must be used within StockMasterProvider');
  return ctx;
}

export function findStockByCode(stocks, code) {
  return stocks.find((s) => s.code === code) ?? null;
}
