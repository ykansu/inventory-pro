import React, { useState, useMemo } from 'react';
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
import { useSettings } from '../../context/SettingsContext';
import styles from './DashboardCharts.module.css';
import commonStyles from './DashboardCommon.module.css';
import useCategoryProfits from '../../hooks/useCategoryProfits';
import { startOfMonth, endOfMonth } from 'date-fns';

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

const CategoryProfitsChart = () => {
  const { t } = useTranslation(['dashboard']);
  const [chartType, setChartType] = useState('pie'); // 'pie' or 'bar'
  const { getCurrency } = useSettings();
  
  // Use useMemo to prevent the dates from being recalculated on every render
  const dateRange = useMemo(() => {
    const today = new Date();
    return {
      startDate: startOfMonth(today),
      endDate: endOfMonth(today)
    };
  }, []);
  
  // Use the same hook as the report component for consistency
  const { data: categoryProfits, loading, error, refresh } = useCategoryProfits(
    dateRange.startDate, 
    dateRange.endDate
  );

  const handleRetry = () => {
    refresh();
  };

  const handleChartTypeChange = (type) => {
    setChartType(type);
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
  
  const { backgroundColors, borderColorsArray } = generateColors(categoryProfits.length);

  // Prepare data for Pie chart
  const pieChartData = {
    labels: categoryProfits.map(category => category.name),
    datasets: [
      {
        label: t('dashboard:labels.profit'),
        data: categoryProfits.map(category => category.profit),
        backgroundColor: backgroundColors,
        borderColor: borderColorsArray,
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for Bar chart (showing profit and cost stacked)
  const barChartData = {
    labels: categoryProfits.map(category => category.name),
    datasets: [
      {
        label: t('dashboard:labels.profit'),
        data: categoryProfits.map(category => category.profit),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: t('dashboard:labels.cost'),
        data: categoryProfits.map(category => category.cost),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
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
            if (context.parsed !== undefined && context.parsed.y !== undefined) {
              label += formatCurrency(context.parsed.y, getCurrency());
            } else if (context.parsed !== undefined) {
              label += formatCurrency(context.parsed, getCurrency());
            }
            return label;
          }
        }
      }
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        stacked: false,
        ticks: {
          callback: (value) => formatCurrency(value, getCurrency()),
        }
      },
      x: {
        stacked: false
      }
    } : undefined
  };

  // Safe percentage calculation function
  const calculateMarginPct = (profit, revenue) => {
    if (!revenue || revenue === 0 || !profit) return '0.0';
    return ((profit / revenue) * 100).toFixed(1);
  };

  const totalRevenue = categoryProfits.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalCost = categoryProfits.reduce((acc, curr) => acc + curr.cost, 0);
  const totalProfit = categoryProfits.reduce((acc, curr) => acc + curr.profit, 0);

  return (
    <div className={commonStyles.dashboardSection}>
      <h3>
        {t('dashboard:sections.categoryProfits')}
        <span className={commonStyles.infoTooltip} data-tooltip={t('dashboard:tooltips.categoryProfits')}>?</span>
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
      ) : categoryProfits.length === 0 ? (
        <div className={commonStyles.placeholderContent}>
          {t('dashboard:placeholders.noCategoryData')}
        </div>
      ) : (
        <div className="category-profit-container">
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
              <div className={styles.detailCell}>{t('dashboard:labels.revenue')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.cost')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.profit')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.marginPct')}</div>
            </div>
            <div>
              {categoryProfits.map((category, index) => (
                <div className={styles.categoryDetailsRow} key={index}>
                  <div className={styles.detailCell}>{category.name}</div>
                  <div className={styles.detailCell}>{formatCurrency(category.revenue || 0, getCurrency())}</div>
                  <div className={styles.detailCell}>{formatCurrency(category.cost || 0, getCurrency())}</div>
                  <div className={styles.detailCell}>{formatCurrency(category.profit || 0, getCurrency())}</div>
                  <div className={styles.detailCell}>{calculateMarginPct(category.profit, category.revenue)}%</div>
                </div>
              ))}
            </div>
            <div className={styles.categoryDetailsFooter}>
              <div className={styles.detailCell}><strong>{t('dashboard:labels.total')}</strong></div>
              <div className={styles.detailCell}><strong>{formatCurrency(totalRevenue, getCurrency())}</strong></div>
              <div className={styles.detailCell}><strong>{formatCurrency(totalCost, getCurrency())}</strong></div>
              <div className={styles.detailCell}><strong>{formatCurrency(totalProfit, getCurrency())}</strong></div>
              <div className={styles.detailCell}><strong>{calculateMarginPct(totalProfit, totalRevenue)}%</strong></div>
            </div>
          </div>
          
          <div className={styles.warningNote}>
            <span className={styles.warningIcon}>⚠️</span> {t('dashboard:notes.marginDiscrepancy')}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryProfitsChart; 