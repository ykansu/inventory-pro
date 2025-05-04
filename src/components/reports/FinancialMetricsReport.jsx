import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import styles from './FinancialMetricsReport.module.css';
import { format, startOfDay, endOfDay } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

const FinancialMetricsReport = ({ startDate, endDate }) => {
  const { t, i18n } = useTranslation(['reports', 'dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { dashboard, expenses } = useDatabase();
  const { getSetting, isLoading: settingsLoading } = useSettings();
  const currency = getSetting('currency', 'usd').toLowerCase();
  
  // Get the appropriate locale based on current language
  const getLocale = () => {
    const currentLanguage = i18n.language || 'en';
    return currentLanguage.startsWith('tr') ? tr : enUS;
  };
  
  const [financialMetrics, setFinancialMetrics] = useState({
    revenue: 0,
    profit: 0,
    profitMargin: 0,
    expenses: 0,
    totalCash: 0,
    revenueExpenseDifference: 0
  });

  const fetchFinancialMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let profitMetrics;
      let totalExpenses = 0;
      const formattedStartDate = startOfDay(startDate);
      const formattedEndDate = endOfDay(endDate);
      
      // Use date-specific functions if startDate and endDate are provided
      if (startDate && endDate) {
        // Get profit metrics for the date range
        profitMetrics = await dashboard.getMonthlyProfitMetricsByDate(formattedStartDate, formattedEndDate);
        
        // Get expenses for the date range
        const expensesResponse = await expenses.getMonthlyExpensesByDate(formattedStartDate, formattedEndDate);
        totalExpenses = expensesResponse?.success ? expensesResponse.data : 0;
      } else {
        // Use regular monthly metrics if no date range is provided
        profitMetrics = await dashboard.getMonthlyProfitMetrics();
        
        // Get expenses for current month
        const expensesResponse = await expenses.getMonthlyExpenses();
        totalExpenses = expensesResponse?.success ? expensesResponse.data : 0;
      }
      
      // Calculate revenue expense difference
      const totalRevenue = profitMetrics?.monthlyRevenue || 0;
      const revenueExpenseDifference = parseFloat(totalRevenue) - parseFloat(totalExpenses);
      
      // Get cash revenue
      const paymentMethodsData = await dashboard.getRevenueByPaymentMethod(
        formattedStartDate,
        formattedEndDate
      );
      const cashRevenue = paymentMethodsData?.find(item => item.method === 'cash')?.revenue || 0;
      
      // Calculate total cash (cash revenue - expenses)
      const totalCash = parseFloat(cashRevenue) - parseFloat(totalExpenses);

      setFinancialMetrics({
        revenue: profitMetrics?.monthlyRevenue || 0,
        profit: profitMetrics?.monthlyProfit || 0,
        profitMargin: profitMetrics?.profitMargin || 0,
        expenses: totalExpenses,
        totalCash: isNaN(totalCash) ? 0 : totalCash,
        revenueExpenseDifference: isNaN(revenueExpenseDifference) ? 0 : revenueExpenseDifference
      });
    } catch (err) {
      console.error('Error fetching financial metrics:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialMetrics();
  }, [startDate, endDate]);

  const handleRetry = () => {
    fetchFinancialMetrics();
  };

  const formatProfitMargin = (value) => {
    if (value === undefined || value === null) return '0%';
    return `${value}%`;
  };

  if (loading || settingsLoading) {
    return <div className={styles.loadingContainer}><LoadingSpinner /></div>;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{t('dashboard:error')}</p>
        <button onClick={handleRetry} className={styles.retryButton}>
          {t('dashboard:retry')}
        </button>
      </div>
    );
  }

  const locale = getLocale();
  const dateRangeLabel = startDate && endDate
    ? t('reports:period', { 
        start: format(startDate, 'd MMMM yyyy', { locale }), 
        end: format(endDate, 'd MMMM yyyy', { locale }) 
      })
    : t('reports:currentMonth');

  return (
    <div className={styles.reportSection}>
      <h3>{t('reports:financialMetrics.title', 'Financial Metrics')}</h3>
      <div className={styles.dateRange}>{dateRangeLabel}</div>
      
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <h4>{t('dashboard:labels.revenue', 'Revenue')}</h4>
          <div className={styles.metricValue}>
            {formatCurrency(financialMetrics.revenue, currency)}
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <h4>{t('dashboard:labels.profit', 'Profit')}</h4>
          <div className={styles.metricValue}>
            {formatCurrency(financialMetrics.profit, currency)}
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <h4>{t('dashboard:stats.profitMargin', 'Profit Margin')}</h4>
          <div className={styles.metricValue}>
            {formatProfitMargin(financialMetrics.profitMargin)}
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <h4>{t('dashboard:labels.expenses', 'Expenses')}</h4>
          <div className={styles.metricValue}>
            {formatCurrency(financialMetrics.expenses, currency)}
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <h4>{t('dashboard:stats.totalCash', 'Total Cash')}</h4>
          <div className={styles.metricValue}>
            {formatCurrency(financialMetrics.totalCash, currency)}
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <h4>{t('dashboard:stats.revenueExpenseDifference', 'Revenue Expense Difference')}</h4>
          <div className={styles.metricValue}>
            {formatCurrency(financialMetrics.revenueExpenseDifference, currency)}
          </div>
        </div>
      </div>
      
      <div className={styles.summaryTable}>
        <table>
          <thead>
            <tr>
              <th>{t('dashboard:labels.metric', 'Metric')}</th>
              <th>{t('dashboard:labels.value', 'Value')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t('dashboard:labels.revenue', 'Revenue')}</td>
              <td>{formatCurrency(financialMetrics.revenue, currency)}</td>
            </tr>
            <tr>
              <td>{t('dashboard:labels.profit', 'Profit')}</td>
              <td>{formatCurrency(financialMetrics.profit, currency)}</td>
            </tr>
            <tr>
              <td>{t('dashboard:stats.profitMargin', 'Profit Margin')}</td>
              <td>{formatProfitMargin(financialMetrics.profitMargin)}</td>
            </tr>
            <tr>
              <td>{t('dashboard:labels.expenses', 'Expenses')}</td>
              <td>{formatCurrency(financialMetrics.expenses, currency)}</td>
            </tr>
            <tr>
              <td>{t('dashboard:stats.totalCash', 'Total Cash')}</td>
              <td>{formatCurrency(financialMetrics.totalCash, currency)}</td>
            </tr>
            <tr>
              <td>{t('dashboard:stats.revenueExpenseDifference', 'Revenue Expense Difference')}</td>
              <td>{formatCurrency(financialMetrics.revenueExpenseDifference, currency)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialMetricsReport; 