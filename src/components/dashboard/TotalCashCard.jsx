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
      
      if (data && data.length > 0) {
        // Find the split payment if it exists
        const splitPaymentIndex = data.findIndex(item => 
          item.method.toLowerCase() === 'split'
        );
        
        // Process data to merge split payments with cash and card
        let processedData = [...data];
        
        // If split payment exists, distribute it to card and cash
        if (splitPaymentIndex !== -1) {
          const splitPayment = processedData[splitPaymentIndex];
          
          // Remove split row
          processedData.splice(splitPaymentIndex, 1);
          
          // Find cash payment or create it if it doesn't exist
          const cashPaymentIndex = processedData.findIndex(item => 
            item.method.toLowerCase() === 'cash'
          );
          
          if (cashPaymentIndex !== -1) {
            // Add split cash portion to existing cash
            processedData[cashPaymentIndex].revenue += 
              (splitPayment.revenue - splitPayment.card_amount);
          } else {
            // Create new cash entry with split cash portion
            processedData.push({
              method: 'cash',
              revenue: splitPayment.revenue - splitPayment.card_amount,
              count: splitPayment.count
            });
          }
          
          // Find card payment or create it if it doesn't exist
          const cardPaymentIndex = processedData.findIndex(item => 
            item.method.toLowerCase() === 'card'
          );
          
          if (cardPaymentIndex !== -1) {
            // Add split card portion to existing card
            processedData[cardPaymentIndex].revenue += splitPayment.card_amount;
            // Track card amount for fee calculation
            processedData[cardPaymentIndex].card_amount = 
              (processedData[cardPaymentIndex].card_amount || 0) + splitPayment.card_amount;
          } else {
            // Create new card entry with split card portion
            processedData.push({
              method: 'card',
              revenue: splitPayment.card_amount,
              card_amount: splitPayment.card_amount,
              count: splitPayment.count
            });
          }
        }
        
        // Filter out methods with zero revenue and normalize method names
        const filteredData = processedData
          .filter(item => item.revenue > 0)
          .map(item => ({
            ...item,
            method: item.method.toLowerCase()
          }));
        
        setRevenueByPayment(filteredData);
      } else {
        setRevenueByPayment([]);
      }
    } catch (error) {
      console.error('Error fetching revenue by payment:', error);
      setError(error);
      setRevenueByPayment([]);
    }
  };

  const fetchTotalCash = async () => {
    try {
      setLoading(true);
      setError(null);

      await fetchRevenueByPayment();
      const monthlyCashRevenue = revenueByPayment.find(item => item.method === 'cash')?.revenue || 0;

      const monthlyExpenseResponse = await expenses.getMonthlyExpenses();
      let monthlyExpenses = 0;
      if (monthlyExpenseResponse && monthlyExpenseResponse.success) {
        monthlyExpenses = monthlyExpenseResponse.data;
      } else {
        setError(monthlyExpenseResponse.error);
      }
      
      // Calculate total cash (revenue - expenses)
      const cash = parseFloat(monthlyCashRevenue) - parseFloat(monthlyExpenses);
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