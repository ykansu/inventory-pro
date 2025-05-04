import React, { useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import useRevenueBySupplier from '../../hooks/useRevenueBySupplier';
import { useSettings } from '../../context/SettingsContext';
import {
  Chart as ChartJS,
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
import styles from './RevenueBySupplierReport.module.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RevenueBySupplierReport = ({ startDate, endDate }) => {
  const { t } = useTranslation(['reports', 'dashboard']);
  const { getSetting, isLoading: settingsLoading } = useSettings();
  const currency = getSetting('currency', 'usd').toLowerCase();
  const { data: supplierData, loading, error, refresh } = useRevenueBySupplier(startDate, endDate);
  
  // Force a refresh when date range changes
  useEffect(() => {
    refresh();
  }, [startDate, endDate, refresh]);

  const handleRetry = () => {
    refresh();
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

  const totalRevenue = supplierData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalProfit = supplierData.reduce((acc, curr) => acc + curr.profit, 0);

  
  if (loading || settingsLoading) {
    return <div className={styles.chartContainer}><LoadingSpinner /></div>;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{t('dashboard:error')}</p>
        <button onClick={handleRetry} className={styles.retryButton}>
          {t('dashboard:retry')}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.reportSection}>
      <h4>{t('reports:types.revenueBySupplier', 'Revenue by Supplier')}</h4>
      
      {supplierData.length === 0 ? (
        <div className={styles.noDataContainer}>
          {t('reports:noData')}
        </div>
      ) : (
        <>
          <div className={styles.chartContainer}>
            <div className={styles.chartWrapper}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
          
          <div className={styles.supplierSummary}>
            <div className={styles.supplierSummaryHeader}>
              <div className={styles.detailCell}>{t('dashboard:labels.supplier')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.revenue')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.profit')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.marginPct')}</div>
            </div>
            
            <div>
              {supplierData.map((supplier, index) => (
                <div className={styles.supplierSummaryRow} key={index}>
                  <div className={styles.detailCell}>{supplier.name}</div>
                  <div className={styles.detailCell}>{formatCurrency(supplier.revenue || 0, currency)}</div>
                  <div className={styles.detailCell}>{formatCurrency(supplier.profit || 0, currency)}</div>
                  <div className={styles.detailCell}>{calculateMarginPct(supplier.profit, supplier.revenue)}%</div>
                </div>
              ))}
            </div>
            
            <div className={styles.supplierSummaryFooter}>
              <div className={styles.detailCell}><strong>{t('dashboard:labels.total')}</strong></div>
              <div className={styles.detailCell}><strong>{formatCurrency(totalRevenue, currency)}</strong></div>
              <div className={styles.detailCell}><strong>{formatCurrency(totalProfit, currency)}</strong></div>
              <div className={styles.detailCell}><strong>{calculateMarginPct(totalProfit, totalRevenue)}%</strong></div>
            </div>
          </div>
          
          <div className={styles.warningNote}>
            <span className={styles.warningIcon}>⚠️</span> {t('dashboard:notes.marginDiscrepancy', 'Note: Margin calculations here may differ from the dashboard card as discounts are not accounted for in this breakdown.')}
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueBySupplierReport; 