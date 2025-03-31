import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import StatCard from './StatCard';
import { useDatabase } from '../../context/DatabaseContext';

const TotalProductsCard = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const { dashboard } = useDatabase();

  useEffect(() => {
    const fetchTotalProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const count = await dashboard.getTotalProductCount();
        setTotalProducts(count || 0);
      } catch (error) {
        console.error('Error fetching total products:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTotalProducts();
  }, [dashboard]);

  const handleRetry = () => {
    fetchTotalProducts();
  };

  return (
    <StatCard
      title={t('dashboard:stats.totalProducts')}
      value={totalProducts}
      isLoading={loading}
      error={error}
      onRetry={handleRetry}
      tooltipKey="totalProducts"
    />
  );
};

export default TotalProductsCard; 