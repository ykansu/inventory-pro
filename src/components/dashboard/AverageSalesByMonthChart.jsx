import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTranslation } from '../../hooks/useTranslation';
import { useSettings } from '../../context/SettingsContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import styles from './DashboardCharts.module.css';
import commonStyles from './DashboardCommon.module.css';
import { useDatabase } from '../../context/DatabaseContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const getYearOptions = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  return [currentYear, currentYear - 1];
};

const AverageSalesByMonthChart = () => {
  const { t } = useTranslation(['dashboard']);
  const { getCurrency } = useSettings();
  const { dashboard } = useDatabase();
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageData, setAverageData] = useState([]);
  const [currency, setCurrency] = useState(getCurrency());

  const monthsOfYear = [
    t('dashboard:months.january', 'Jan'),
    t('dashboard:months.february', 'Feb'),
    t('dashboard:months.march', 'Mar'),
    t('dashboard:months.april', 'Apr'),
    t('dashboard:months.may', 'May'),
    t('dashboard:months.june', 'Jun'),
    t('dashboard:months.july', 'Jul'),
    t('dashboard:months.august', 'Aug'),
    t('dashboard:months.september', 'Sep'),
    t('dashboard:months.october', 'Oct'),
    t('dashboard:months.november', 'Nov'),
    t('dashboard:months.december', 'Dec'),
  ];

  useEffect(() => {
    setCurrency(getCurrency());
  }, [getCurrency]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboard.getAverageSalesByMonthOfYear(year);
      setAverageData(data);
    } catch (err) {
      setError(err.message || 'Error fetching data');
      setAverageData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const chartData = {
    labels: monthsOfYear,
    datasets: [
      {
        label: t('dashboard:labels.saleCount', 'Sale Count'),
        data: averageData.map(d => d.averageSaleCount),
        backgroundColor: 'rgba(53, 162, 235, 0.6)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
        yAxisID: 'y-sale',
      },
      {
        label: t('dashboard:labels.revenue', 'Revenue'),
        data: averageData.map(d => d.averageRevenue),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        yAxisID: 'y-revenue',
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
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              if (context.dataset.label === t('dashboard:labels.revenue', 'Revenue')) {
                return label + formatCurrency(context.parsed.y, currency);
              }
              return label + context.parsed.y;
            }
            return label;
          },
        },
      },
    },
    scales: {
      'y-sale': {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: t('dashboard:labels.saleCount', 'Sale Count'),
        },
        ticks: {
          callback: (value) => value,
        },
      },
      'y-revenue': {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: t('dashboard:labels.revenue', 'Revenue'),
        },
        ticks: {
          callback: (value) => formatCurrency(value, currency),
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const handleYearChange = (e) => {
    setYear(Number(e.target.value));
  };

  return (
    <div className={commonStyles.dashboardSection}>
      <h3>
        {t('dashboard:sections.averageSalesByMonth', 'Average Sales by Month of Year')}
        <span className={commonStyles.infoTooltip} data-tooltip={t('dashboard:tooltips.averageSalesByMonth', 'Shows average sale count and revenue by month of the year.')}>?</span>
      </h3>
      <div className={styles.chartControls}>
        <div className={styles.controlGroup}>
          <label htmlFor="year">{t('dashboard:labels.year')}:</label>
          <select id="year" value={year} onChange={handleYearChange} className="period-select">
            {getYearOptions().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.chartContainer} style={{ height: 300 }}>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className={commonStyles.errorContainer}>
            <p>{t('dashboard:error')}</p>
            <button onClick={fetchData} className={commonStyles.retryButton}>
              {t('dashboard:retry')}
            </button>
          </div>
        ) : averageData.length === 0 ? (
          <div className={commonStyles.placeholderContent}>
            {t('dashboard:placeholders.noAverageSalesData')}
          </div>
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};

export default AverageSalesByMonthChart; 