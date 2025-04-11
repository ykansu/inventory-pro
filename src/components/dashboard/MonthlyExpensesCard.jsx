import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import StatCard from './StatCard';
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';

const MonthlyExpensesCard = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const { expenses } = useDatabase();
  const { getCurrency } = useSettings();

  useEffect(() => {
    const fetchMonthlyExpenses = async () => {
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
        let total = 0;
        if (Array.isArray(monthlyExpenseData)) {
          monthlyExpenseData.forEach(expense => {
            const amount = parseFloat(expense.amount);
            if (!isNaN(amount)) {
              total += amount;
            }
          });
        }
        
        setMonthlyExpenses(total);
      } catch (error) {
        console.error('Error fetching monthly expenses:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyExpenses();
  }, [expenses]);

  const handleRetry = () => {
    const fetchMonthlyExpenses = async () => {
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
        let total = 0;
        if (Array.isArray(monthlyExpenseData)) {
          monthlyExpenseData.forEach(expense => {
            const amount = parseFloat(expense.amount);
            if (!isNaN(amount)) {
              total += amount;
            }
          });
        }
        
        setMonthlyExpenses(total);
      } catch (error) {
        console.error('Error fetching monthly expenses:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMonthlyExpenses();
  };

  return (
    <StatCard
      title={t('dashboard:stats.monthlyExpenses')}
      value={formatCurrency(monthlyExpenses, getCurrency())}
      isLoading={loading}
      error={error}
      onRetry={handleRetry}
      tooltipKey="monthlyExpenses"
    />
  );
};

export default MonthlyExpensesCard; 