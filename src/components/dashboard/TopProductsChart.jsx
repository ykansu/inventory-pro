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
import '../../styles/components/index.css';

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
    const fetchTopProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get real data from database
        const data = await dashboard.getTopSellingProducts(showCount);
        
        if (data && data.length > 0) {
          // Process the data to ensure it has all required fields
          const processedData = data.map(product => ({
            ...product,
            // Calculate profit margin if not provided
            profitMargin: product.profitMargin || 
              Math.round((product.profit / product.revenue) * 100) || 0
          }));
          
          // Sort the data based on the selected sort criteria
          const sortedData = [...processedData].sort((a, b) => {
            if (sortBy === 'revenue') return b.revenue - a.revenue;
            if (sortBy === 'profit') return b.profit - a.profit;
            return b.quantity - a.quantity;
          });
          
          setTopProducts(sortedData);
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

    fetchTopProducts();
  }, [dashboard, sortBy, showCount]);

  const handleRetry = () => {
    fetchTopProducts();
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleShowCountChange = (e) => {
    setShowCount(parseInt(e.target.value));
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

  return (
    <div className="dashboard-section">
      <h3>
        {t('dashboard:sections.topProducts')}
        <span className="info-tooltip" data-tooltip={t('dashboard:tooltips.topProducts')}>?</span>
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
      ) : (
        <>
          <div className="top-products-controls">
            <div className="sort-by-control">
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
            
            <div className="show-count-control">
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
          </div>
          
          {topProducts.length === 0 ? (
            <div className="placeholder-content">
              {t('dashboard:placeholders.noProductData')}
            </div>
          ) : (
            <div className="chart-container" style={{ height: `${Math.max(250, 50 * topProducts.length)}px` }}>
              <Bar data={chartData} options={chartOptions} />
              <div className="products-detail-info">
                <div className="products-detail-header">
                  <div className="detail-cell">{t('dashboard:labels.product')}</div>
                  <div className="detail-cell">{t('dashboard:labels.quantity')}</div>
                  <div className="detail-cell">{t('dashboard:labels.revenue')}</div>
                  <div className="detail-cell">{t('dashboard:labels.profit')}</div>
                  <div className="detail-cell">{t('dashboard:labels.margin')}</div>
                </div>
                {topProducts.map((product) => (
                  <div key={product.id} className="products-detail-row">
                    <div className="detail-cell product-name">{product.name}</div>
                    <div className="detail-cell">{product.quantity}</div>
                    <div className="detail-cell">{formatCurrency(product.revenue, currency)}</div>
                    <div className="detail-cell">{formatCurrency(product.profit, currency)}</div>
                    <div className="detail-cell">{product.profitMargin}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TopProductsChart; 