import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import StatCard from './StatCard';
import { useDatabase } from '../../context/DatabaseContext';

const SupplierPerformanceCard = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [onTimeDelivery, setOnTimeDelivery] = useState(0);
  const { suppliers } = useDatabase();

  useEffect(() => {
    const fetchSupplierPerformance = async () => {
      try {
        setLoading(true);
        
        // In a real app, this would fetch actual supplier performance data
        // For now using a placeholder value
        setOnTimeDelivery(87);
      } catch (error) {
        console.error('Error fetching supplier performance:', error);
        setOnTimeDelivery(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierPerformance();
  }, [suppliers]);

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