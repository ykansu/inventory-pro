import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import useCategoryProfits from '../../hooks/useCategoryProfits';
import { useSettings } from '../../context/SettingsContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import styles from './CategoryProfitsChart.module.css';

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

const CategoryProfitsChart = ({ startDate, endDate }) => {
  const { t } = useTranslation(['reports', 'dashboard']);
  const { getSetting, isLoading: settingsLoading } = useSettings();
  const currency = getSetting('currency', 'usd').toLowerCase();
  const { data: categoryData, loading, error, refresh } = useCategoryProfits(startDate, endDate);
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'
  
  // Force a refresh when date range changes
  useEffect(() => {
    refresh();
  }, [startDate, endDate, refresh]);

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

  const { backgroundColors, borderColorsArray } = generateColors(categoryData.length);

  // Prepare data for Pie chart
  const pieChartData = {
    labels: categoryData.map(category => category.name),
    datasets: [
      {
        label: t('dashboard:labels.profit'),
        data: categoryData.map(category => category.profit),
        backgroundColor: backgroundColors,
        borderColor: borderColorsArray,
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for Bar chart
  const barChartData = {
    labels: categoryData.map(category => category.name),
    datasets: [
      {
        label: t('dashboard:labels.profit'),
        data: categoryData.map(category => category.profit),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: t('dashboard:labels.cost'),
        data: categoryData.map(category => category.cost),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }
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
              label += formatCurrency(context.parsed.y, currency);
            } else if (context.parsed !== undefined) {
              label += formatCurrency(context.parsed, currency);
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
          callback: (value) => formatCurrency(value, currency),
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

  const totalRevenue = categoryData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalProfit = categoryData.reduce((acc, curr) => acc + curr.profit, 0);
  const totalCost = categoryData.reduce((acc, curr) => acc + curr.cost, 0);

  
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
      <h4>{t('reports:types.categoryProfits', 'Category Profits')}</h4>
      
      {categoryData.length === 0 ? (
        <div className={styles.noDataContainer}>
          {t('reports:noData')}
        </div>
      ) : (
        <>
          <div className={styles.chartTypeSelector}>
            <button 
              className={`${styles.chartTypeBtn} ${chartType === 'bar' ? styles.active : ''}`}
              onClick={() => handleChartTypeChange('bar')}
            >
              {t('dashboard:labels.barChart', 'Bar Chart')}
            </button>
            <button 
              className={`${styles.chartTypeBtn} ${chartType === 'pie' ? styles.active : ''}`}
              onClick={() => handleChartTypeChange('pie')}
            >
              {t('dashboard:labels.pieChart', 'Pie Chart')}
            </button>
          </div>
          
          <div className={styles.chartContainer}>
            <div className={styles.chartWrapper}>
              {chartType === 'pie' ? (
                <Pie data={pieChartData} options={chartOptions} />
              ) : (
                <Bar data={barChartData} options={chartOptions} />
              )}
            </div>
          </div>
          
          <div className={styles.categorySummary}>
            <div className={styles.categorySummaryHeader}>
              <div className={styles.detailCell}>{t('dashboard:labels.category')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.revenue')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.cost')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.profit')}</div>
              <div className={styles.detailCell}>{t('dashboard:labels.marginPct')}</div>
            </div>
            
            <div>
              {categoryData.map((category, index) => (
                <div className={styles.categorySummaryRow} key={index}>
                  <div className={styles.detailCell}>{category.name}</div>
                  <div className={styles.detailCell}>{formatCurrency(category.revenue || 0, currency)}</div>
                  <div className={styles.detailCell}>{formatCurrency(category.cost || 0, currency)}</div>
                  <div className={styles.detailCell}>{formatCurrency(category.profit || 0, currency)}</div>
                  <div className={styles.detailCell}>{calculateMarginPct(category.profit, category.revenue)}%</div>
                </div>
              ))}
            </div>
            
            <div className={styles.categorySummaryFooter}>
              <div className={styles.detailCell}><strong>{t('dashboard:labels.total')}</strong></div>
              <div className={styles.detailCell}><strong>{formatCurrency(totalRevenue, currency)}</strong></div>
              <div className={styles.detailCell}><strong>{formatCurrency(totalCost, currency)}</strong></div>
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

export default CategoryProfitsChart; 