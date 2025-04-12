import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
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
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const RevenueBySupplierChart = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supplierData, setSupplierData] = useState([]);
  const [currency, setCurrency] = useState('usd');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
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
    const fetchSupplierData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get real data from database
        const data = await dashboard.getRevenueAndProfitBySupplier();
        
        if (data && data.length > 0) {
          // Sort suppliers by revenue for better visualization
          const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);
          setSupplierData(sortedData);
          setTotalRevenue(sortedData.reduce((sum, supplier) => sum + supplier.revenue, 0));
          setTotalProfit(sortedData.reduce((sum, supplier) => sum + supplier.profit, 0));
        } else {
          setSupplierData([]);
          setTotalRevenue(0);
          setTotalProfit(0);
        }
      } catch (error) {
        console.error('Error fetching supplier data:', error);
        setError(error);
        setSupplierData([]);
        setTotalRevenue(0);
        setTotalProfit(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierData();
  }, [dashboard]);

  const handleRetry = () => {
    fetchSupplierData();
  };

  // Prepare chart data
  const chartData = {
    labels: supplierData.map(supplier => supplier.name),
    datasets: [
      {
        label: t('dashboard:labels.revenue'),
        data: supplierData.map(supplier => supplier.revenue),
        backgroundColor: 'rgba(53, 162, 235, 0.6)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: t('dashboard:labels.profit'),
        data: supplierData.map(supplier => supplier.profit),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }
    ],
  };

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.x !== null) {
              label += formatCurrency(context.parsed.x, currency);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value, currency),
        }
      }
    }
  };

  // Safe percentage calculation function
  const calculateMarginPct = (profit, revenue) => {
    if (!revenue || revenue === 0 || !profit) return '0.0';
    return ((profit / revenue) * 100).toFixed(1);
  };

  return (
    <div className={commonStyles.dashboardSection}>
      <h3>
        {t('dashboard:sections.revenueBySupplier')}
        <span className={commonStyles.infoTooltip} data-tooltip={t('dashboard:tooltips.revenueBySupplier')}>?</span>
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
      ) : supplierData.length === 0 ? (
        <div className={commonStyles.placeholderContent}>
          {t('dashboard:placeholders.noSupplierData')}
        </div>
      ) : (
        <div className="supplier-revenue-container">
          <div className={styles.chartContainer} style={{ height: `${Math.max(250, 50 * supplierData.length)}px` }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
          
          <div className={styles.supplierSummary}>
            <div className={styles.supplierSummaryHeader}>
              <div className={styles.detailCell}>{t('dashboard:labels.supplier')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.revenue')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.profit')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.marginPct')}</div>
            </div>
            {supplierData.map((supplier, index) => {
              const marginPct = calculateMarginPct(supplier.profit, supplier.revenue);
              
              return (
                <div className={styles.supplierSummaryRow} key={index}>
                  <div className={styles.detailCell}>{supplier.name}</div>
                  <div className={styles.detailCell}>{formatCurrency(supplier.revenue || 0, currency)}</div>
                  <div className={styles.detailCell}>{formatCurrency(supplier.profit || 0, currency)}</div>
                  <div className={styles.detailCell}>{marginPct}%</div>
                </div>
              );
            })}
            <div className={styles.supplierSummaryFooter}>
              <div className={styles.detailCell}><strong>{t('dashboard:labels.total')}</strong></div>
              <div className={styles.detailCell}><strong>{formatCurrency(totalRevenue, currency)}</strong></div>
              <div className={styles.detailCell}><strong>{formatCurrency(totalProfit, currency)}</strong></div>
              <div className={styles.detailCell}><strong>{calculateMarginPct(totalProfit, totalRevenue)}%</strong></div>
            </div>
            
            <div className={styles.warningNote}>
              <span className={styles.warningIcon}>⚠️</span> {t('dashboard:notes.marginDiscrepancy', 'Note: Margin calculations here may differ from the dashboard card as discounts are not accounted for in this breakdown.')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueBySupplierChart; 