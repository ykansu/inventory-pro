import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import StatCard from './StatCard';
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';
import { endOfMonth, startOfMonth } from 'date-fns';
import useRevenueByPayment from '../../hooks/useRevenueByPayment';

const TotalCashCard = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCash, setTotalCash] = useState(0);
  const [trend, setTrend] = useState(null);
  const { expenses } = useDatabase();
  const { getCurrency } = useSettings();
  const { data: revenueByPayment, loading: revenueLoading, error: revenueError, refresh: refreshRevenue } = useRevenueByPayment();

  useEffect(() => {
    fetchTotalCash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revenueByPayment, expenses, t]);

  const fetchTotalCash = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!revenueByPayment) return;
      const monthlyCashRevenue = revenueByPayment.find(item => item.method === 'cash')?.revenue || 0;
      const monthlyExpenseResponse = await expenses.getMonthlyExpenses();
      let monthlyExpenses = 0;
      if (monthlyExpenseResponse && monthlyExpenseResponse.success) {
        monthlyExpenses = monthlyExpenseResponse.data;
      } else {
        setError(monthlyExpenseResponse.error);
      }
      const cash = parseFloat(monthlyCashRevenue) - parseFloat(monthlyExpenses);
      const finalCash = isNaN(cash) ? 0 : cash;
      setTotalCash(finalCash);
      setTrend({
        direction: finalCash >= 0 ? 'up' : 'down',
        value: finalCash >= 0 ? t('dashboard:positive') : t('dashboard:negative'),
        icon: finalCash >= 0 ? '↑' : '↓'
      });
    } catch (error) {
      console.error('Error calculating total cash:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    refreshRevenue();
    fetchTotalCash();
  };

  return (
    <StatCard
      title={t('dashboard:stats.totalCash')}
      value={formatCurrency(totalCash, getCurrency())}
      isLoading={loading || revenueLoading}
      error={error || revenueError}
      onRetry={handleRetry}
      tooltipKey="totalCash"
      trend={trend}
    />
  );
};

export default TotalCashCard; 