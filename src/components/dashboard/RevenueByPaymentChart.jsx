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
  const [totalRevenue, setTotalRevenue] = useState(0);
  const { dashboard } = useDatabase();
  const { 
    getSetting,
    isLoading: settingsLoading 
  } = useSettings();
  
  // Get settings
  const currency = getSetting('currency', 'usd').toLowerCase();
  const creditCardVendorFee = getSetting('credit_card_vendor_fee', 0.68);

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
    const fetchRevenueByPayment = async () => {
      if (settingsLoading) return;
      
      setLoading(true);
      setError(null);
      try {
        // Get real data from database
        const data = await dashboard.getRevenueByPaymentMethod();
        
        if (data && data.length > 0) {
          // Find the split payment if it exists
          const splitPaymentIndex = data.findIndex(item => 
            item.method.toLowerCase() === 'split'
          );
          
          // Process data to merge split payments with cash and card
          let processedData = [...data];
          
          // If split payment exists, distribute it to card and cash
          if (splitPaymentIndex !== -1) {
            const splitPayment = processedData[splitPaymentIndex];
            
            // Remove split row
            processedData.splice(splitPaymentIndex, 1);
            
            // Find cash payment or create it if it doesn't exist
            const cashPaymentIndex = processedData.findIndex(item => 
              item.method.toLowerCase() === 'cash'
            );
            
            if (cashPaymentIndex !== -1) {
              // Add split cash portion to existing cash
              processedData[cashPaymentIndex].revenue += 
                (splitPayment.revenue - splitPayment.card_amount);
            } else {
              // Create new cash entry with split cash portion
              processedData.push({
                method: 'cash',
                revenue: splitPayment.revenue - splitPayment.card_amount,
                count: splitPayment.count
              });
            }
            
            // Find card payment or create it if it doesn't exist
            const cardPaymentIndex = processedData.findIndex(item => 
              item.method.toLowerCase() === 'card'
            );
            
            if (cardPaymentIndex !== -1) {
              // Add split card portion to existing card
              processedData[cardPaymentIndex].revenue += splitPayment.card_amount;
              // Track card amount for fee calculation
              processedData[cardPaymentIndex].card_amount = 
                (processedData[cardPaymentIndex].card_amount || 0) + splitPayment.card_amount;
            } else {
              // Create new card entry with split card portion
              processedData.push({
                method: 'card',
                revenue: splitPayment.card_amount,
                card_amount: splitPayment.card_amount,
                count: splitPayment.count
              });
            }
          }
          
          // Filter out methods with zero revenue and normalize method names
          const filteredData = processedData
            .filter(item => item.revenue > 0)
            .map(item => ({
              ...item,
              method: item.method.toLowerCase()
            }));
          
          setRevenueByPayment(filteredData);
          setTotalRevenue(filteredData.reduce((sum, method) => sum + method.revenue, 0));
        } else {
          setRevenueByPayment([]);
          setTotalRevenue(0);
        }
      } catch (error) {
        console.error('Error fetching revenue by payment:', error);
        setError(error);
        setRevenueByPayment([]);
        setTotalRevenue(0);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueByPayment();
  }, [dashboard, settingsLoading]);

  const handleRetry = () => {
    fetchRevenueByPayment();
  };

  const getPercentage = (revenue) => {
    return totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : 0;
  };

  // Get card revenue (including card portion of split payments which is now merged)
  const getCardRevenue = () => {
    const cardPayment = revenueByPayment.find(item => item.method.toLowerCase() === 'card');
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
      
      {loading || settingsLoading ? (
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
              
              {/* Add net amount row for card payments after vendor fee */}
              {revenueByPayment.some(item => item.method.toLowerCase() === 'card') && (
                <div className="payment-summary-row net-amount-row">
                  <div className="summary-cell">
                    <span className="payment-color-indicator" style={{ backgroundColor: 'rgba(33, 150, 243, 0.3)' }}></span>
                    {t('dashboard:labels.netCardAmountAfterFee', 'Net Card Amount (After Vendor Fee)')}
                  </div>
                  <div className="summary-cell">
                    {formatCurrency(
                      getNetCardAmount(getCardRevenue()), 
                      currency
                    )}
                  </div>
                  <div className="summary-cell">
                    <small>({t('dashboard:labels.feePercentage', { 0: creditCardVendorFee })})</small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueByPaymentChart; 