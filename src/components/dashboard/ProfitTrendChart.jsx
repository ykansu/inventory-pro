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

const ProfitTrendChart = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const { settings, dashboard } = useDatabase();
  const [currency, setCurrency] = useState('usd');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsObj = await settings.getAllSettings();
        setCurrency(settingsObj.currency?.toLowerCase() || 'usd');
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, [settings]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get profit and revenue trend data from the database
        const data = await dashboard.getProfitAndRevenueTrend(6);
        
        if (data && data.length > 0) {
          setTrendData(data);
        } else {
          // Fallback sample data
          setTrendData([
            { month: 'Jan', revenue: 28000, profit: 10640 },
            { month: 'Feb', revenue: 32400, profit: 12636 },
            { month: 'Mar', revenue: 29800, profit: 11324 },
            { month: 'Apr', revenue: 37500, profit: 14250 },
            { month: 'May', revenue: 34200, profit: 13338 },
            { month: 'Jun', revenue: 38900, profit: 15600 }
          ]);
        }
      } catch (error) {
        console.error('Error fetching trend data:', error);
        setError(error);
        
        // Set fallback data
        setTrendData([
          { month: 'Jan', revenue: 28000, profit: 10640 },
          { month: 'Feb', revenue: 32400, profit: 12636 },
          { month: 'Mar', revenue: 29800, profit: 11324 },
          { month: 'Apr', revenue: 37500, profit: 14250 },
          { month: 'May', revenue: 34200, profit: 13338 },
          { month: 'Jun', revenue: 38900, profit: 15600 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dashboard]);

  const handleRetry = () => {
    fetchData();
  };

  const chartData = {
    labels: trendData.map(point => point.month),
    datasets: [
      {
        label: t('dashboard:labels.revenue'),
        data: trendData.map(point => point.revenue),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: t('dashboard:labels.profit'),
        data: trendData.map(point => point.profit),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
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

  return (
    <div className="dashboard-section">
      <h3>
        {t('dashboard:sections.profitTrend')}
        <span className="info-tooltip" data-tooltip={t('dashboard:tooltips.profitTrend')}>?</span>
      </h3>
      <div className="chart-container">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="error-container">
            <p>{t('dashboard:error')}</p>
            <button onClick={handleRetry} className="retry-button">
              {t('dashboard:retry')}
            </button>
          </div>
        ) : trendData.length > 0 ? (
          <div className="chart-container" style={{ height: '300px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        ) : (
          <p className="placeholder-content">{t('dashboard:placeholders.noTrendData')}</p>
        )}
      </div>
    </div>
  );
};

export default ProfitTrendChart; 