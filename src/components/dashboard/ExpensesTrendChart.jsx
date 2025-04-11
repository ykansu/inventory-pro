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
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';
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

const ExpensesTrendChart = ({ months = 6 }) => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const { expenses } = useDatabase();
  const { getCurrency } = useSettings();
  const currency = getCurrency();

  useEffect(() => {
    const fetchExpensesTrend = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get trend data directly from the database
        const response = await expenses.getExpensesTrend(months);
        
        if (response && response.success && Array.isArray(response.data)) {
          setChartData(response.data);
        } else {
          console.error('Invalid response from getExpensesTrend:', response);
          setChartData([]);
        }
      } catch (error) {
        console.error('Error fetching expenses trend:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpensesTrend();
  }, [expenses, months]);
  
  const handleRetry = () => {
    const fetchExpensesTrend = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get trend data directly from the database
        const response = await expenses.getExpensesTrend(months);
        
        if (response && response.success && Array.isArray(response.data)) {
          setChartData(response.data);
        } else {
          setChartData([]);
        }
      } catch (error) {
        console.error('Error fetching expenses trend:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpensesTrend();
  };

  const barChartData = {
    labels: chartData.map(point => point.name),
    datasets: [
      {
        label: t('dashboard:labels.expenses'),
        data: chartData.map(point => point.expenses),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }
    ]
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
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y, currency);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value, currency),
        }
      }
    }
  };
  
  if (loading) {
    return (
      <div className="dashboard-section">
        <h3>{t('dashboard:sections.expensesTrend')}</h3>
        <div className="chart-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="dashboard-section">
        <h3>{t('dashboard:sections.expensesTrend')}</h3>
        <div className="chart-container">
          <div className="error-container">
            <p>{t('dashboard:error')}</p>
            <button onClick={handleRetry} className="retry-button">
              {t('dashboard:retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!chartData || chartData.length === 0) {
    return (
      <div className="dashboard-section">
        <h3>{t('dashboard:sections.expensesTrend')}</h3>
        <div className="chart-container">
          <p className="placeholder-content">{t('dashboard:placeholders.noTrendData')}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-section">
      <h3>
        {t('dashboard:sections.expensesTrend')}
        <span className="info-tooltip" data-tooltip={t('dashboard:tooltips.expensesTrend')}>?</span>
      </h3>
      <div className="chart-container" style={{ height: '300px' }}>
        <Bar data={barChartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default ExpensesTrendChart; 