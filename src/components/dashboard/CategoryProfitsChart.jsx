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
import { useSettings } from '../../context/SettingsContext';
import '../../styles/components/index.css';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryProfits, setCategoryProfits] = useState([]);
  const [chartType, setChartType] = useState('pie'); // 'pie' or 'bar'
  const { dashboard } = useDatabase();
  const { getCurrency } = useSettings();

  useEffect(() => {
    const fetchCategoryProfits = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get real data from database
        const data = await dashboard.getProfitByCategory();
        
        if (data && data.length > 0) {
          // Calculate margin for each category if not provided
          const processedData = data.map(category => ({
            ...category,
            margin: category.margin || Math.round((category.profit / category.revenue) * 100) || 0
          }));
          setCategoryProfits(processedData);
        } else {
          setCategoryProfits([]);
        }
      } catch (error) {
        console.error('Error fetching category profits:', error);
        setError(error);
        setCategoryProfits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProfits();
  }, [dashboard]);

  const handleRetry = () => {
    fetchCategoryProfits();
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

  return (
    <div className="dashboard-section">
      <h3>
        {t('dashboard:sections.categoryProfits')}
        <span className="info-tooltip" data-tooltip={t('dashboard:tooltips.categoryProfits')}>?</span>
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
      ) : categoryProfits.length === 0 ? (
        <div className="placeholder-content">
          {t('dashboard:placeholders.noCategoryData')}
        </div>
      ) : (
        <div className="category-profit-container">
          <div className="chart-type-selector">
            <button 
              className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange('pie')}
            >
              {t('dashboard:labels.pieChart')}
            </button>
            <button 
              className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange('bar')}
            >
              {t('dashboard:labels.barChart')}
            </button>
          </div>
          
          <div className="chart-container" style={{ height: '300px' }}>
            {chartType === 'pie' ? (
              <Pie data={pieChartData} options={chartOptions} />
            ) : (
              <Bar data={barChartData} options={chartOptions} />
            )}
          </div>
          
          <div className="category-details-table">
            <div className="category-details-header">
              <div className="details-cell">{t('dashboard:labels.category')}</div>
              <div className="details-cell">{t('dashboard:labels.revenue')}</div>
              <div className="details-cell">{t('dashboard:labels.cost')}</div>
              <div className="details-cell">{t('dashboard:labels.profit')}</div>
              <div className="details-cell">{t('dashboard:labels.margin')}</div>
            </div>
            {categoryProfits.map((category, index) => (
              <div key={`category-${index}-${category.name}`} className="category-details-row">
                <div className="details-cell">{category.name}</div>
                <div className="details-cell">{formatCurrency(category.revenue, getCurrency())}</div>
                <div className="details-cell">{formatCurrency(category.cost, getCurrency())}</div>
                <div className="details-cell">{formatCurrency(category.profit, getCurrency())}</div>
                <div className="details-cell">{category.margin}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryProfitsChart; 