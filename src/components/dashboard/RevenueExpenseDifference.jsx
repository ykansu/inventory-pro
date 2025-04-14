import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import StatCard from './StatCard';
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';
import { endOfMonth, startOfMonth } from 'date-fns';

const RevenueExpenseDifferenceCard = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCash, setTotalCash] = useState(0);
  const [trend, setTrend] = useState(null);
  const { dashboard, expenses } = useDatabase();
  const { getCurrency } = useSettings();

  useEffect(() => {
    fetchTotalCash();
  }, [dashboard, expenses, t]);

  const handleRetry = () => {
    fetchTotalCash();
  };

  const fetchTotalCash = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get monthly profit metrics for revenue
      const profitMetrics = await dashboard.getMonthlyProfitMetrics();
      const monthlyRevenue = profitMetrics?.monthlyRevenue || 0;
      
      // Get expenses for the current month
      const monthlyExpenseResponse = await expenses.getMonthlyExpenses();
      
      
      // Extract the expenses array from the response
      
      let monthlyExpenses = 0;
      if (monthlyExpenseResponse && monthlyExpenseResponse.success) {
        monthlyExpenses = monthlyExpenseResponse.data;
      } else {
        setError(monthlyExpenseResponse.error);
      }
      
      // Calculate total cash (revenue - expenses)
      const cash = parseFloat(monthlyRevenue) - parseFloat(monthlyExpenses);
      const finalCash = isNaN(cash) ? 0 : cash;
      
      setTotalCash(finalCash);
      
      // Set trend based on whether cash is positive or negative
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

  return (
    <StatCard
      title={t('dashboard:stats.revenueExpenseDifference')}
      value={formatCurrency(totalCash, getCurrency())}
      isLoading={loading}
      error={error}
      onRetry={handleRetry}
      tooltipKey="revenueExpenseDifference"
      trend={trend}
    />
  );
};

export default RevenueExpenseDifferenceCard; 