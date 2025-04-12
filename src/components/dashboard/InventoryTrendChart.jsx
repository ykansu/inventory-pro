import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { useDatabase } from '../../context/DatabaseContext';
import styles from './DashboardCharts.module.css';
import commonStyles from './DashboardCommon.module.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const InventoryTrendChart = () => {
  const defaultArray = [Array(6).fill(0)];
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventoryTrend, setInventoryTrend] = useState(defaultArray);
  const [currency, setCurrency] = useState('usd');
  const { settings, dashboard } = useDatabase();

  

  useEffect(() => {
    // Get currency from settings
    const loadSettings = async () => {
      try {
        if (settings) {
          const settingsObj = await settings.getAllSettings();
          setCurrency(settingsObj.currency?.toLowerCase() || 'usd');
        }
      } catch (error) {
        console.error('Error fetching currency settings:', error);
      }
    };

    loadSettings();
  }, [settings]);

  useEffect(() => {
    const fetchInventoryTrend = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get real data from database
        const data = await dashboard.getInventoryTrend(6);
        setInventoryTrend(data || defaultArray);
      } catch (error) {
        console.error('Error fetching inventory trend:', error);
        setError(error);
        setInventoryTrend(defaultArray);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryTrend();
  }, [dashboard]);

  const handleRetry = () => {
    fetchInventoryTrend();
  };

  // Prepare chart data
  const chartData = {
    labels: inventoryTrend.map(item => item.month),
    datasets: [
      {
        label: t('dashboard:labels.inventoryValue'),
        data: inventoryTrend.map(item => item.value),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y, currency);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value, currency),
        }
      }
    }
  };

  return (
    <div className={commonStyles.dashboardSection}>
      <h3>
        {t('dashboard:sections.inventoryTrend')}
        <span className={commonStyles.infoTooltip} data-tooltip={t('dashboard:tooltips.inventoryTrend')}>?</span>
      </h3>
      
      {loading ? (
        <div className={styles.chartContainer}>
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className={commonStyles.errorContainer}>
          <p>{t('dashboard:error')}</p>
          <button onClick={handleRetry} className={commonStyles.retryButton}>
            {t('dashboard:retry')}
          </button>
        </div>
      ) : inventoryTrend.length === 0 ? (
        <div className={commonStyles.placeholderContent}>
          {t('dashboard:placeholders.noTrendData')}
        </div>
      ) : (
        <div className={styles.chartContainer} style={{ height: '300px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default InventoryTrendChart; 