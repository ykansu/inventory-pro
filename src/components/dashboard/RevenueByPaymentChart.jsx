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
import '../../styles/components/index.css';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const RevenueByPaymentChart = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueByPayment, setRevenueByPayment] = useState([]);
  const [currency, setCurrency] = useState('usd');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const { settings, dashboard } = useDatabase();

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
    const fetchRevenueByPayment = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get real data from database
        const data = await dashboard.getRevenueByPaymentMethod();
        
        if (data && data.length > 0) {
          // Filter out methods with zero revenue and normalize method names
          const filteredData = data
            .filter(item => item.revenue > 0)
            .map(item => ({
              ...item,
              method: item.method.toLowerCase()
            }));
          
          setRevenueByPayment(filteredData);
          setTotalRevenue(filteredData.reduce((sum, method) => sum + method.revenue, 0));
        } else {
          // Fallback sample data if no real data is available
          const sampleData = [
            { method: 'cash', revenue: 8500 },
            { method: 'card', revenue: 15000 }
          ];
          setRevenueByPayment(sampleData);
          setTotalRevenue(sampleData.reduce((sum, method) => sum + method.revenue, 0));
        }
      } catch (error) {
        console.error('Error fetching revenue by payment:', error);
        setError(error);
        // Sample data as fallback
        const sampleData = [
          { method: 'cash', revenue: 8500 },
          { method: 'card', revenue: 15000 }
        ];
        setRevenueByPayment(sampleData);
        setTotalRevenue(sampleData.reduce((sum, method) => sum + method.revenue, 0));
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueByPayment();
  }, [dashboard]);

  const handleRetry = () => {
    fetchRevenueByPayment();
  };

  const getPercentage = (revenue) => {
    return totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : 0;
  };

  const getColor = (method) => {
    return paymentMethodColors[method.toLowerCase()] || paymentMethodColors['other'];
  };

  const getBorderColor = (method) => {
    return paymentMethodBorderColors[method.toLowerCase()] || paymentMethodBorderColors['other'];
  };

  // Prepare chart data
  const chartData = {
    labels: revenueByPayment.map(item => t(`dashboard:paymentMethods.${item.method}`)),
    datasets: [
      {
        data: revenueByPayment.map(item => item.revenue),
        backgroundColor: revenueByPayment.map(item => getColor(item.method)),
        borderColor: revenueByPayment.map(item => getBorderColor(item.method)),
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
    <div className="dashboard-section">
      <h3>
        {t('dashboard:sections.revenueByPayment')}
        <span className="info-tooltip" data-tooltip={t('dashboard:tooltips.revenueByPayment')}>?</span>
      </h3>
      
      {loading ? (
        <div className="chart-container">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{t('dashboard:error')}</p>
          <button onClick={handleRetry} className="retry-button">
            {t('dashboard:retry')}
          </button>
        </div>
      ) : revenueByPayment.length === 0 ? (
        <div className="placeholder-content">
          {t('dashboard:placeholders.noPaymentData')}
        </div>
      ) : (
        <div className="payment-chart">
          <div className="chart-container" style={{ height: '300px' }}>
            <Doughnut data={chartData} options={chartOptions} />
          </div>
          
          <div className="payment-summary">
            <div className="payment-summary-header">
              <h4>{t('dashboard:labels.paymentSummary')}</h4>
              <div className="payment-total">
                {t('dashboard:labels.total')}: {formatCurrency(totalRevenue, currency)}
              </div>
            </div>
            <div className="payment-summary-table">
              <div className="payment-summary-header-row">
                <div className="summary-cell">{t('dashboard:labels.method')}</div>
                <div className="summary-cell">{t('dashboard:labels.revenue')}</div>
                <div className="summary-cell">{t('dashboard:labels.percentage')}</div>
              </div>
              {revenueByPayment.map((item, index) => (
                <div key={item.method + index} className="payment-summary-row">
                  <div className="summary-cell">
                    <span className="payment-color-indicator" style={{ backgroundColor: getBorderColor(item.method) }}></span>
                    {t(`dashboard:paymentMethods.${item.method}`)}
                  </div>
                  <div className="summary-cell">{formatCurrency(item.revenue, currency)}</div>
                  <div className="summary-cell">{getPercentage(item.revenue)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueByPaymentChart; 