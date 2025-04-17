import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import StatCard from './StatCard';
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';
import { endOfMonth, startOfMonth } from 'date-fns';

const TotalCashCard = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCash, setTotalCash] = useState(0);
  const [revenueByPayment, setRevenueByPayment] = useState([]);
  const [trend, setTrend] = useState(null);
  const { dashboard, expenses } = useDatabase();
  const { getCurrency } = useSettings();

  useEffect(() => {
    fetchTotalCash();
  }, [dashboard, expenses, t]);


  const fetchRevenueByPayment = async () => {    
    try {
      // Get real data from database
      const data = await dashboard.getRevenueByPaymentMethod();
      let filteredData = [];
      if (data && data.length > 0) {
        // Find the split payment if it exists
        const splitPaymentIndex = data.findIndex(item => 
          item.method.toLowerCase() === 'split'
        );
        let processedData = [...data];
        if (splitPaymentIndex !== -1) {
          const splitPayment = processedData[splitPaymentIndex];
          processedData.splice(splitPaymentIndex, 1);
          const cashPaymentIndex = processedData.findIndex(item => 
            item.method.toLowerCase() === 'cash'
          );
          if (cashPaymentIndex !== -1) {
            processedData[cashPaymentIndex].revenue += 
              (splitPayment.revenue - splitPayment.card_amount);
          } else {
            processedData.push({
              method: 'cash',
              revenue: splitPayment.revenue - splitPayment.card_amount,
              count: splitPayment.count
            });
          }
          const cardPaymentIndex = processedData.findIndex(item => 
            item.method.toLowerCase() === 'card'
          );
          if (cardPaymentIndex !== -1) {
            processedData[cardPaymentIndex].revenue += splitPayment.card_amount;
            processedData[cardPaymentIndex].card_amount = 
              (processedData[cardPaymentIndex].card_amount || 0) + splitPayment.card_amount;
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
          .map(item => ({
            ...item,
            method: item.method.toLowerCase()
          }));
        setRevenueByPayment(filteredData);
      } else {
        setRevenueByPayment([]);
      }
      return filteredData;
    } catch (error) {
      console.error('Error fetching revenue by payment:', error);
      setError(error);
      setRevenueByPayment([]);
      return [];
    }
  };

  const fetchTotalCash = async () => {
    try {
      setLoading(true);
      setError(null);
      const revenueData = await fetchRevenueByPayment();
      const monthlyCashRevenue = revenueData.find(item => item.method === 'cash')?.revenue || 0;
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
    fetchTotalCash();
  };

  return (
    <StatCard
      title={t('dashboard:stats.totalCash')}
      value={formatCurrency(totalCash, getCurrency())}
      isLoading={loading}
      error={error}
      onRetry={handleRetry}
      tooltipKey="totalCash"
      trend={trend}
    />
  );
};

export default TotalCashCard; 