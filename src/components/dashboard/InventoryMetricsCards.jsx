import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import StatCard from './StatCard';
import { useDatabase } from '../../context/DatabaseContext';
import { formatCurrency } from '../../utils/formatters';

const InventoryMetricsCards = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventoryMetrics, setInventoryMetrics] = useState({
    turnoverRate: 0,
    totalValue: 0,
    stockVariance: 0
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
    const fetchInventoryMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get inventory value from the dashboard service
        const totalValue = await dashboard.getInventoryValue();
        
        // In a real app, these would be calculated from actual data
        // For now using placeholder values for turnover and variance
        setInventoryMetrics({
          turnoverRate: 4.2,
          totalValue,
          stockVariance: 2.3
        });
      } catch (error) {
        console.error('Error fetching inventory metrics:', error);
        setError(error);
        // Keep default values
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryMetrics();
  }, [dashboard]);

  const handleRetry = () => {
    fetchInventoryMetrics();
  };

  return (
    <>
      <StatCard
        title={t('dashboard:stats.inventoryTurnover')}
        value={`${inventoryMetrics.turnoverRate.toFixed(1)}x`}
        isLoading={loading}
        error={error}
        onRetry={handleRetry}
        tooltipKey="inventoryTurnover"
      />
      
      <StatCard
        title={t('dashboard:stats.inventoryValue')}
        value={formatCurrency(inventoryMetrics.totalValue, currency)}
        isLoading={loading}
        error={error}
        onRetry={handleRetry}
        tooltipKey="inventoryValue"
      />
      
      <StatCard
        title={t('dashboard:stats.stockVariance')}
        value={`${inventoryMetrics.stockVariance.toFixed(1)}%`}
        isLoading={loading}
        error={error}
        onRetry={handleRetry}
        tooltipKey="stockVariance"
      />
    </>
  );
};

export default InventoryMetricsCards; 