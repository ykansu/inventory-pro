import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import StatCard from './StatCard';
import { useDatabase } from '../../context/DatabaseContext';

const SupplierPerformanceCard = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [onTimeDelivery, setOnTimeDelivery] = useState(0);
  const { suppliers, dashboard } = useDatabase();

  useEffect(() => {
    const fetchSupplierPerformance = async () => {
      try {
        setLoading(true);
        
        // Get real supplier performance data
        const performance = await dashboard.getSupplierPerformance();
        setOnTimeDelivery(performance?.onTimeDelivery || 0);
      } catch (error) {
        console.error('Error fetching supplier performance:', error);
        setOnTimeDelivery(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierPerformance();
  }, [suppliers, dashboard]);

  return (
    <StatCard
      title={t('dashboard:stats.supplierPerformance')}
      value={loading ? '' : `${onTimeDelivery}%`}
      isLoading={loading}
      tooltipKey="supplierPerformance"
    />
  );
};

export default SupplierPerformanceCard; 