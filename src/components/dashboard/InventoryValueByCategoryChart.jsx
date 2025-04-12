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
import { Pie, Bar } from 'react-chartjs-2';
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

const InventoryValueByCategoryChart = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [currency, setCurrency] = useState('usd');
  const [chartType, setChartType] = useState('pie'); // 'pie' or 'bar'
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
    const fetchInventoryValueByCategory = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get real data from database
        const data = await dashboard.getInventoryValueByCategory();
        
        if (data && data.length > 0) {
          setCategoryData(data);
        } else {
          setCategoryData([]);
        }
      } catch (error) {
        console.error('Error fetching inventory value by category:', error);
        setError(error);
        setCategoryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryValueByCategory();
  }, [dashboard]);

  const handleRetry = () => {
    const fetchInventoryValueByCategory = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get real data from database
        const data = await dashboard.getInventoryValueByCategory();
        
        if (data && data.length > 0) {
          setCategoryData(data);
        } else {
          setCategoryData([]);
        }
      } catch (error) {
        console.error('Error fetching inventory value by category:', error);
        setError(error);
        setCategoryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryValueByCategory();
  };

  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  // Safe percentage calculation function
  const calculatePercentage = (value, total) => {
    if (!total || total === 0 || !value) return '0.0';
    return ((value / total) * 100).toFixed(1);
  };

  // Generate colors for chart
  const generateColors = (count) => {
    const colors = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
      'rgba(199, 199, 199, 0.6)',
      'rgba(83, 102, 255, 0.6)',
      'rgba(40, 159, 64, 0.6)',
      'rgba(210, 199, 199, 0.6)',
    ];
    
    // For border colors (darker versions)
    const borderColors = [
      'rgba(255, 99, 132, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)',
      'rgba(199, 199, 199, 1)',
      'rgba(83, 102, 255, 1)',
      'rgba(40, 159, 64, 1)',
      'rgba(210, 199, 199, 1)',
    ];
    
    // If we need more colors than available in our palette, we'll repeat them
    const backgroundColors = Array(count).fill().map((_, i) => colors[i % colors.length]);
    const borderColorsArray = Array(count).fill().map((_, i) => borderColors[i % borderColors.length]);
    
    return { backgroundColors, borderColorsArray };
  };
  
  const { backgroundColors, borderColorsArray } = generateColors(categoryData.length);

  // Calculate total inventory value with null check
  const totalInventoryValue = categoryData.reduce((sum, category) => sum + (category.value || 0), 0);

  // Prepare data for Pie chart
  const pieChartData = {
    labels: categoryData.map(category => category.name || ''),
    datasets: [
      {
        label: t('dashboard:labels.inventoryValue'),
        data: categoryData.map(category => category.value || 0),
        backgroundColor: backgroundColors,
        borderColor: borderColorsArray,
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for Bar chart
  const barChartData = {
    labels: categoryData.map(category => category.name || ''),
    datasets: [
      {
        label: t('dashboard:labels.inventoryValue'),
        data: categoryData.map(category => category.value || 0),
        backgroundColor: backgroundColors,
        borderColor: borderColorsArray,
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
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            let value = 0;
            if (context.parsed !== undefined && context.parsed.y !== undefined) {
              value = context.parsed.y || 0;
            } else if (context.parsed !== undefined) {
              value = context.parsed || 0;
            }
            return label + formatCurrency(value, currency);
          }
        }
      }
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value || 0, currency),
        }
      }
    } : undefined
  };

  return (
    <div className={commonStyles.dashboardSection}>
      <h3>
        {t('dashboard:sections.inventoryValueByCategory')}
        <span className={commonStyles.infoTooltip} data-tooltip={t('dashboard:tooltips.inventoryValueByCategory')}>?</span>
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
      ) : categoryData.length === 0 ? (
        <div className={commonStyles.placeholderContent}>
          {t('dashboard:placeholders.noCategoryData')}
        </div>
      ) : (
        <div className="category-value-container">
          <div className={styles.chartTypeSelector}>
            <button 
              className={`${styles.chartTypeBtn} ${chartType === 'pie' ? styles.active : ''}`}
              onClick={() => handleChartTypeChange('pie')}
            >
              {t('dashboard:labels.pieChart')}
            </button>
            <button 
              className={`${styles.chartTypeBtn} ${chartType === 'bar' ? styles.active : ''}`}
              onClick={() => handleChartTypeChange('bar')}
            >
              {t('dashboard:labels.barChart')}
            </button>
          </div>
          
          <div className={styles.chartContainer} style={{ height: '300px' }}>
            {chartType === 'pie' ? (
              <Pie data={pieChartData} options={chartOptions} />
            ) : (
              <Bar data={barChartData} options={chartOptions} />
            )}
          </div>
          
          <div className={styles.categoryDetailsTable}>
            <div className={styles.categoryDetailsHeader}>
              <div className={styles.detailCell}>{t('dashboard:labels.category')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.items')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.value')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.percentage')}</div>
            </div>
            {categoryData.map((category, index) => {
              const percentage = calculatePercentage(category.value, totalInventoryValue);
              
              return (
                <div className={styles.categoryDetailsRow} key={index}>
                  <div className={styles.detailCell}>{category.name}</div>
                  <div className={styles.detailCell}>{category.productCount || 0}</div>
                  <div className={styles.detailCell}>{formatCurrency(category.value || 0, currency)}</div>
                  <div className={styles.detailCell}>{percentage}%</div>
                </div>
              );
            })}
            <div className={styles.categoryDetailsFooter}>
              <div className={styles.detailCell}><strong>{t('dashboard:labels.total')}</strong></div>
              <div className={styles.detailCell}>
                <strong>{categoryData.reduce((sum, cat) => sum + (cat.productCount || 0), 0)}</strong>
              </div>
              <div className={styles.detailCell}>
                <strong>{formatCurrency(totalInventoryValue, currency)}</strong>
              </div>
              <div className={styles.detailCell}><strong>100%</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryValueByCategoryChart; 