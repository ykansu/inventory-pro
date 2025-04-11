import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import StatCard from './StatCard';
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';

const TotalCashCard = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCash, setTotalCash] = useState(0);
  const [trend, setTrend] = useState(null);
  const { dashboard, expenses } = useDatabase();
  const { getCurrency } = useSettings();

  useEffect(() => {
    const fetchTotalCash = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get the current date
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Create date range for current month
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);
        
        // Format dates for the API
        const formattedStartDate = startDate.toISOString();
        const formattedEndDate = endDate.toISOString();
        
        // Get monthly profit metrics for revenue
        const profitMetrics = await dashboard.getMonthlyProfitMetrics();
        const monthlyRevenue = profitMetrics?.monthlyRevenue || 0;
        
        // Get expenses for the current month
        const monthlyExpenseResponse = await expenses.getAllExpenses({ 
          startDate: formattedStartDate, 
          endDate: formattedEndDate 
        });
        
        // Extract the expenses array from the response
        let monthlyExpenseData = [];
        
        if (monthlyExpenseResponse && monthlyExpenseResponse.success && Array.isArray(monthlyExpenseResponse.data)) {
          monthlyExpenseData = monthlyExpenseResponse.data;
        } else if (Array.isArray(monthlyExpenseResponse)) {
          monthlyExpenseData = monthlyExpenseResponse;
        }
        
        // Calculate total expenses
        let monthlyExpenses = 0;
        if (Array.isArray(monthlyExpenseData)) {
          monthlyExpenseData.forEach(expense => {
            const amount = parseFloat(expense.amount);
            if (!isNaN(amount)) {
              monthlyExpenses += amount;
            }
          });
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

    fetchTotalCash();
  }, [dashboard, expenses, t]);

  const handleRetry = () => {
    const fetchTotalCash = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get the current date
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Create date range for current month
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);
        
        // Format dates for the API
        const formattedStartDate = startDate.toISOString();
        const formattedEndDate = endDate.toISOString();
        
        // Get monthly profit metrics for revenue
        const profitMetrics = await dashboard.getMonthlyProfitMetrics();
        const monthlyRevenue = profitMetrics?.monthlyRevenue || 0;
        
        // Get expenses for the current month
        const monthlyExpenseResponse = await expenses.getAllExpenses({ 
          startDate: formattedStartDate, 
          endDate: formattedEndDate 
        });
        
        // Extract the expenses array from the response
        let monthlyExpenseData = [];
        
        if (monthlyExpenseResponse && monthlyExpenseResponse.success && Array.isArray(monthlyExpenseResponse.data)) {
          monthlyExpenseData = monthlyExpenseResponse.data;
        } else if (Array.isArray(monthlyExpenseResponse)) {
          monthlyExpenseData = monthlyExpenseResponse;
        }
        
        // Calculate total expenses
        let monthlyExpenses = 0;
        if (Array.isArray(monthlyExpenseData)) {
          monthlyExpenseData.forEach(expense => {
            const amount = parseFloat(expense.amount);
            if (!isNaN(amount)) {
              monthlyExpenses += amount;
            }
          });
        }
        
        // Calculate total cash (revenue - expenses)
        const cash = parseFloat(monthlyRevenue) - parseFloat(monthlyExpenses);
        setTotalCash(isNaN(cash) ? 0 : cash);
        
        // Set trend based on whether cash is positive or negative
        setTrend({
          direction: cash >= 0 ? 'up' : 'down',
          value: cash >= 0 ? t('dashboard:positive') : t('dashboard:negative'),
          icon: cash >= 0 ? '↑' : '↓'
        });
      } catch (error) {
        console.error('Error calculating total cash:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    
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