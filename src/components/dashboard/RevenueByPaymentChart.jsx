import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import styles from './DashboardCharts.module.css';
import commonStyles from './DashboardCommon.module.css';
import useRevenueByPayment from '../../hooks/useRevenueByPayment';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const RevenueByPaymentChart = () => {
  const { t } = useTranslation(['dashboard']);
  const { getSetting, isLoading: settingsLoading } = useSettings();
  const currency = getSetting('currency', 'usd').toLowerCase();
  const creditCardVendorFee = getSetting('credit_card_vendor_fee', 0.68);
  const { data: revenueByPayment, loading, error, refresh } = useRevenueByPayment();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const { dashboard } = useDatabase();
  
  // Define colors for payment methods
  const paymentMethodColors = {
    'cash': 'rgba(76, 175, 80, 0.6)',
    'card': 'rgba(33, 150, 243, 0.6)',
    'bank_transfer': 'rgba(156, 39, 176, 0.6)',
    'check': 'rgba(255, 152, 0, 0.6)',
    'mobile_payment': 'rgba(233, 30, 99, 0.6)',
    'split': 'rgba(124, 58, 237, 0.6)',
    'other': 'rgba(158, 158, 158, 0.6)'
  };

  // Define border colors (darker versions)
  const paymentMethodBorderColors = {
    'cash': 'rgba(76, 175, 80, 1)',
    'card': 'rgba(33, 150, 243, 1)',
    'bank_transfer': 'rgba(156, 39, 176, 1)',
    'check': 'rgba(255, 152, 0, 1)',
    'mobile_payment': 'rgba(233, 30, 99, 1)',
    'split': 'rgba(124, 58, 237, 1)',
    'other': 'rgba(158, 158, 158, 1)'
  };

  useEffect(() => {
    if (revenueByPayment && revenueByPayment.length > 0) {
      setTotalRevenue(revenueByPayment.reduce((sum, method) => sum + method.revenue, 0));
    } else {
      setTotalRevenue(0);
    }
  }, [revenueByPayment]);

  const handleRetry = () => {
    refresh();
  };

  const getPercentage = (revenue) => {
    return totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : 0;
  };

  const getCardRevenue = () => {
    const cardPayment = revenueByPayment?.find(item => item.method.toLowerCase() === 'card');
    return cardPayment ? (cardPayment.card_amount || cardPayment.revenue) : 0;
  };

  const getNetCardAmount = (revenue) => {
    const amount = revenue - (revenue * (creditCardVendorFee / 100));
    return parseFloat(amount.toFixed(2));
  };

  const getColor = (method) => {
    return paymentMethodColors[method.toLowerCase()] || paymentMethodColors['other'];
  };

  const getBorderColor = (method) => {
    return paymentMethodBorderColors[method.toLowerCase()] || paymentMethodBorderColors['other'];
  };

  // Prepare chart data
  const chartData = {
    labels: revenueByPayment?.map(item => t(`dashboard:paymentMethods.${item.method}`)) || [],
    datasets: [
      {
        data: revenueByPayment?.map(item => item.revenue) || [],
        backgroundColor: revenueByPayment?.map(item => getColor(item.method)) || [],
        borderColor: revenueByPayment?.map(item => getBorderColor(item.method)) || [],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          boxWidth: 10,
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw;
            const percentage = getPercentage(value);
            return `${label}: ${formatCurrency(value, currency)} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className={commonStyles.dashboardSection}>
      <h3>
        {t('dashboard:sections.revenueByPayment')}
        <span className={commonStyles.infoTooltip} data-tooltip={t('dashboard:tooltips.revenueByPayment')}>?</span>
      </h3>
      
      {loading || settingsLoading ? (
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
      ) : revenueByPayment.length === 0 ? (
        <div className={commonStyles.placeholderContent}>
          {t('dashboard:placeholders.noPaymentData')}
        </div>
      ) : (
        <div className="payment-chart-container">
          <div className={styles.chartContainer} style={{ height: '300px' }}>
            <Doughnut data={chartData} options={chartOptions} />
          </div>
          
          <div className={styles.paymentSummary}>
            <div className={styles.paymentSummaryHeaderRow}>
              <div className={styles.detailCell}>{t('dashboard:labels.method')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.revenue')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.percentage')}</div>
            </div>
            {revenueByPayment.map((item, index) => (
              <div className={styles.paymentSummaryRow} key={index}>
                <div className={styles.detailCell}>
                  {t(`dashboard:paymentMethods.${item.method}`)}
                </div>
                <div className={styles.detailCell}>
                  {formatCurrency(item.revenue, currency)}
                </div>
                <div className={styles.detailCell}>
                  {getPercentage(item.revenue)}%
                </div>
              </div>
            ))}
            
            {/* Add separate row for net card amount after fee */}
            {revenueByPayment.some(item => item.method.toLowerCase() === 'card') && (
              <div className={`${styles.paymentSummaryRow} ${styles.netCardRow}`}>
                <div className={styles.detailCell}>
                  {t('dashboard:labels.netCardAmountAfterFee')}
                </div>
                <div className={styles.detailCell}>
                  {formatCurrency(
                    getNetCardAmount(getCardRevenue()), 
                    currency
                  )}
                  <div className={styles.feeNote}>
                    {t('dashboard:labels.feePercentage', { 0: (creditCardVendorFee * 100).toFixed(1) })}
                  </div>
                </div>
                <div className={styles.detailCell}>-</div>
              </div>
            )}
            
            <div className={styles.paymentSummaryRow}>
              <div className={styles.detailCell}><strong>{t('dashboard:labels.total')}</strong></div>
              <div className={styles.detailCell}><strong>{formatCurrency(totalRevenue, currency)}</strong></div>
              <div className={styles.detailCell}><strong>100%</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueByPaymentChart; 