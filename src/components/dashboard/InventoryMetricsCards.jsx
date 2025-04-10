import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import StatCard from './StatCard';
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';

const InventoryMetricsCards = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventoryMetrics, setInventoryMetrics] = useState({
    turnoverRate: 0,
    totalValue: 0,
  });
  const { dashboard } = useDatabase();
  const { getCurrency } = useSettings();

  useEffect(() => {
    const fetchInventoryMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get inventory value from the dashboard service
        const totalValue = await dashboard.getInventoryValue();
        
        // Get turnover rate and stock variance from the database
        const turnoverRate = await dashboard.getInventoryTurnoverRate();
        
        setInventoryMetrics({
          turnoverRate: turnoverRate || 0,
          totalValue: totalValue || 0,
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
        value={formatCurrency(inventoryMetrics.totalValue, getCurrency())}
        isLoading={loading}
        error={error}
        onRetry={handleRetry}
        tooltipKey="inventoryValue"
      />
    </>
  );
};

export default InventoryMetricsCards; 