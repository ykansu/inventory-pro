import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { DashboardService } from '../../services/DatabaseService';
import StatCard from './StatCard';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';

const TodaySalesCard = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [todaySales, setTodaySales] = useState(0);
  const { getCurrency } = useSettings();

  useEffect(() => {
    const fetchTodaySales = async () => {
      try {
        setLoading(true);
        
        // Use the dedicated dashboard service method that calls the backend function
        const total = await DashboardService.getTodaySalesTotal();
        setTodaySales(total);
        
        // Log for debugging
        console.log('Today sales retrieved from backend:', total);
      } catch (error) {
        console.error('Error fetching today sales:', error);
        setTodaySales(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySales();
  }, []);

  return (
    <StatCard
      title={t('dashboard:stats.todaySales')}
      value={loading ? '' : formatCurrency(todaySales, getCurrency())}
      isLoading={loading}
      tooltipKey="todaySales"
    />
  );
};

export default TodaySalesCard; 