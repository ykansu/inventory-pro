import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import StatCard from './StatCard';
import { useDatabase } from '../../context/DatabaseContext';
import { formatCurrency } from '../../utils/formatters';

const MonthlyProfitMetricsCards = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profitMetrics, setProfitMetrics] = useState({
    monthlyRevenue: 0,
    monthlyProfit: 0,
    profitMargin: 0
  });
  const { settings, dashboard } = useDatabase();
  const [currency, setCurrency] = useState('usd');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsObj = await settings.getAllSettings();
        setCurrency(settingsObj.currency?.toLowerCase() || 'usd');
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, [settings]);

  useEffect(() => {
    const fetchProfitMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const metrics = await dashboard.getMonthlyProfitMetrics();
        setProfitMetrics(metrics || { monthlyRevenue: 0, monthlyProfit: 0, profitMargin: 0 });
      } catch (error) {
        console.error('Error fetching profit metrics:', error);
        setError(error);
        // Keep default values in case of error
      } finally {
        setLoading(false);
      }
    };

    fetchProfitMetrics();
  }, [dashboard]);

  const handleRetry = () => {
    const fetchProfitMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const metrics = await dashboard.getMonthlyProfitMetrics();
        setProfitMetrics(metrics || { monthlyRevenue: 0, monthlyProfit: 0, profitMargin: 0 });
      } catch (error) {
        console.error('Error fetching profit metrics:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfitMetrics();
  };

  // Format the profit margin value
  const formatProfitMargin = (value) => {
    if (value === undefined || value === null) return '0%';
    return `${value}%`;
  };

  return (
    <>
      <StatCard
        title={t('dashboard:stats.monthlyRevenue')}
        value={formatCurrency(profitMetrics.monthlyRevenue, currency)}
        isLoading={loading}
        error={error}
        onRetry={handleRetry}
        tooltipKey="monthlyRevenue"
      />
      
      <StatCard
        title={t('dashboard:stats.monthlyProfit')}
        value={formatCurrency(profitMetrics.monthlyProfit, currency)}
        isLoading={loading}
        error={error}
        onRetry={handleRetry}
        tooltipKey="monthlyProfit"
      />
      
      <StatCard
        title={t('dashboard:stats.profitMargin')}
        value={formatProfitMargin(profitMetrics.profitMargin)}
        isLoading={loading}
        error={error}
        onRetry={handleRetry}
        tooltipKey="profitMargin"
      />
    </>
  );
};

export default MonthlyProfitMetricsCards; 