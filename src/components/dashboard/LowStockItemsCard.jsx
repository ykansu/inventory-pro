import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import StatCard from './StatCard';
import { useDatabase } from '../../context/DatabaseContext';

const LowStockItemsCard = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  const { dashboard } = useDatabase();

  useEffect(() => {
    const fetchLowStockItems = async () => {
      try {
        setLoading(true);
        const count = await dashboard.getLowStockItemCount();
        setLowStockCount(count);
      } catch (error) {
        console.error('Error fetching low stock items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockItems();
  }, [dashboard]);

  return (
    <StatCard
      title={t('dashboard:stats.lowStockItems')}
      value={lowStockCount}
      isLoading={loading}
      tooltipKey="lowStockItems"
    />
  );
};

export default LowStockItemsCard; 