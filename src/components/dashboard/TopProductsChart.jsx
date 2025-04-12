import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
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

const TopProductsChart = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [currency, setCurrency] = useState('usd');
  const [sortBy, setSortBy] = useState('revenue'); // 'revenue', 'profit', or 'quantity'
  const [showCount, setShowCount] = useState(5);
  const [period, setPeriod] = useState('month'); // 'month', 'week', or 'year'
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

  const fetchTopProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get real data from database - passing all parameters to backend
      const data = await dashboard.getTopSellingProducts(period, showCount, sortBy);
      
      if (data && data.length > 0) {
        // Process the data to ensure it has all required fields
        const processedData = data.map(product => ({
          ...product,
          // Calculate profit margin if not provided
          profitMargin: product.profitMargin || 
            Math.round((product.profit / product.revenue) * 100) || 0
        }));
        
        // The data is already sorted by the backend based on the sortBy parameter
        setTopProducts(processedData);
      } else {
        setTopProducts([]);
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
      setError(error);
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopProducts();
  }, [dashboard, sortBy, showCount, period]);

  const handleRetry = () => {
    fetchTopProducts();
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleShowCountChange = (e) => {
    setShowCount(parseInt(e.target.value));
  };
  
  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  // Prepare chart data based on current sort criteria
  const chartData = {
    labels: topProducts.map(product => product.name),
    datasets: [
      {
        label: t(`dashboard:labels.${sortBy}`),
        data: topProducts.map(product => 
          sortBy === 'revenue' ? product.revenue : 
          sortBy === 'profit' ? product.profit : 
          product.quantity
        ),
        backgroundColor: 
          sortBy === 'revenue' ? 'rgba(53, 162, 235, 0.6)' : 
          sortBy === 'profit' ? 'rgba(75, 192, 192, 0.6)' : 
          'rgba(255, 159, 64, 0.6)',
        borderColor: 
          sortBy === 'revenue' ? 'rgba(53, 162, 235, 1)' : 
          sortBy === 'profit' ? 'rgba(75, 192, 192, 1)' : 
          'rgba(255, 159, 64, 1)',
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
              if (sortBy === 'revenue' || sortBy === 'profit') {
                label += formatCurrency(context.parsed.x, currency);
              } else {
                label += context.parsed.x;
              }
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
          callback: (value) => {
            if (sortBy === 'revenue' || sortBy === 'profit') {
              return formatCurrency(value, currency);
            }
            return value;
          }
        }
      }
    }
  };

  const totalQuantity = topProducts.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalRevenue = topProducts.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalProfit = topProducts.reduce((acc, curr) => acc + curr.profit, 0);
  const totalMargin = (totalProfit / totalRevenue * 100).toFixed(1);

  return (
    <div className={commonStyles.dashboardSection}>
      <h3>
        {t('dashboard:sections.topProducts')}
        <span className={commonStyles.infoTooltip} data-tooltip={t('dashboard:tooltips.topProducts')}>?</span>
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
      ) : (
        <>
          <div className={styles.chartControls}>
            <div className={styles.controlGroup}>
              <label htmlFor="sort-by">{t('dashboard:labels.sortBy')}:</label>
              <select 
                id="sort-by" 
                value={sortBy} 
                onChange={handleSortChange}
                className="sort-select"
              >
                <option value="revenue">{t('dashboard:labels.revenue')}</option>
                <option value="profit">{t('dashboard:labels.profit')}</option>
                <option value="quantity">{t('dashboard:labels.quantity')}</option>
              </select>
            </div>
            
            <div className={styles.controlGroup}>
              <label htmlFor="show-count">{t('dashboard:labels.show')}:</label>
              <select 
                id="show-count" 
                value={showCount} 
                onChange={handleShowCountChange}
                className="count-select"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
              </select>
            </div>
            
            <div className={styles.controlGroup}>
              <label htmlFor="period">{t('dashboard:labels.period')}:</label>
              <select 
                id="period" 
                value={period} 
                onChange={handlePeriodChange}
                className="period-select"
              >
                <option value="month">{t('dashboard:periods.month')}</option>
                <option value="week">{t('dashboard:periods.week')}</option>
                <option value="year">{t('dashboard:periods.year')}</option>
              </select>
            </div>
          </div>
          
          {topProducts.length === 0 ? (
            <div className={commonStyles.placeholderContent}>
              {t('dashboard:placeholders.noProductData')}
            </div>
          ) : (
            <>
              <div className={styles.chartContainer} style={{ height: `${Math.max(250, 50 * topProducts.length)}px` }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
              <div className={styles.productsDetailInfo}>
                  <div className={styles.productsDetailHeader}>
                    <div className={styles.detailCell}>{t('dashboard:labels.product')}</div>
                    <div className={styles.detailCell}>{t('dashboard:labels.quantity')}</div>
                    <div className={styles.detailCell}>{t('dashboard:labels.revenue')}</div>
                    <div className={styles.detailCell}>{t('dashboard:labels.profit')}</div>
                    <div className={styles.detailCell}>{t('dashboard:labels.margin')}</div>
                  </div>
                  {topProducts.map((product, index) => (
                    <div className={styles.productsDetailRow} key={index}>
                      <div className={styles.detailCell}>{product.name}</div>
                      <div className={styles.detailCell}>{product.quantity}</div>
                      <div className={styles.detailCell}>{formatCurrency(product.revenue, currency)}</div>
                      <div className={styles.detailCell}>{formatCurrency(product.profit, currency)}</div>
                      <div className={styles.detailCell}>{product.profitMargin}%</div>
                    </div>
                  ))}
                  <div className={styles.categoryDetailsFooter}>
                    <div className={styles.detailCell}><strong>{t('dashboard:labels.total')}</strong></div>
                    <div className={styles.detailCell}><strong>{totalQuantity}</strong></div>
                    <div className={styles.detailCell}><strong>{formatCurrency(totalRevenue, currency)}</strong></div>
                    <div className={styles.detailCell}><strong>{formatCurrency(totalProfit, currency)}</strong></div>
                    <div className={styles.detailCell}><strong>{totalMargin}%</strong></div>
                  </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default TopProductsChart;