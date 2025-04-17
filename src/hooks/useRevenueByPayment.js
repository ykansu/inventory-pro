import { useState, useEffect, useRef, useCallback } from 'react';
import { useDatabase } from '../context/DatabaseContext';

/**
 * useRevenueByPayment - Shared dashboard hook for revenue by payment data.
 * Fetches, processes, and caches the result. Only one DB call per dashboard session unless refresh is called.
 * Usage:
 *   const { data, loading, error, refresh } = useRevenueByPayment();
 */
export default function useRevenueByPayment() {
  const { dashboard } = useDatabase();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Prevent double fetches
  const fetchPromise = useRef(null);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await dashboard.getRevenueByPaymentMethod();
      let filteredData = [];
      if (raw && raw.length > 0) {
        // Split logic
        const splitPaymentIndex = raw.findIndex(item => item.method.toLowerCase() === 'split');
        let processedData = [...raw];
        if (splitPaymentIndex !== -1) {
          const splitPayment = processedData[splitPaymentIndex];
          processedData.splice(splitPaymentIndex, 1);
          const cashPaymentIndex = processedData.findIndex(item => item.method.toLowerCase() === 'cash');
          if (cashPaymentIndex !== -1) {
            processedData[cashPaymentIndex].revenue += (splitPayment.revenue - splitPayment.card_amount);
          } else {
            processedData.push({
              method: 'cash',
              revenue: splitPayment.revenue - splitPayment.card_amount,
              count: splitPayment.count
            });
          }
          const cardPaymentIndex = processedData.findIndex(item => item.method.toLowerCase() === 'card');
          if (cardPaymentIndex !== -1) {
            processedData[cardPaymentIndex].revenue += splitPayment.card_amount;
            processedData[cardPaymentIndex].card_amount = (processedData[cardPaymentIndex].card_amount || 0) + splitPayment.card_amount;
          } else {
            processedData.push({
              method: 'card',
              revenue: splitPayment.card_amount,
              card_amount: splitPayment.card_amount,
              count: splitPayment.count
            });
          }
        }
        filteredData = processedData
          .filter(item => item.revenue > 0)
          .map(item => ({ ...item, method: item.method.toLowerCase() }));
      }
      setData(filteredData);
      return filteredData;
    } catch (err) {
      setError(err);
      setData([]);
      return [];
    } finally {
      setLoading(false);
      fetchPromise.current = null;
    }
  }, [dashboard]);

  // Only fetch if not loaded
  useEffect(() => {
    if (data.length === 0 && !loading && !fetchPromise.current) {
      fetchPromise.current = fetchRevenue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, fetchRevenue]);

  // Manual refresh
  const refresh = useCallback(() => {
    if (!fetchPromise.current) {
      fetchPromise.current = fetchRevenue();
    }
  }, [fetchRevenue]);

  return { data, loading, error, refresh };
} 