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
import { useDatabase } from '../../context/DatabaseContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import styles from './DashboardCharts.module.css';
import commonStyles from './DashboardCommon.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AverageSalesByDayChart = () => {
  const { t } = useTranslation(['dashboard']);
  const { getCurrency } = useSettings();
  const { dashboard } = useDatabase();
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageData, setAverageData] = useState([]);
  const [currency, setCurrency] = useState(getCurrency());

  const daysOfWeek = [
    t('dashboard:days.monday', 'Monday'),
    t('dashboard:days.tuesday', 'Tuesday'),
    t('dashboard:days.wednesday', 'Wednesday'),
    t('dashboard:days.thursday', 'Thursday'),
    t('dashboard:days.friday', 'Friday'),
    t('dashboard:days.saturday', 'Saturday'),
    t('dashboard:days.sunday', 'Sunday'),
  ];

  useEffect(() => {
    setCurrency(getCurrency());
  }, [getCurrency]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboard.getAverageSalesByDayOfWeek(period);
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
  }, [period]);

  const chartData = {
    labels: daysOfWeek,
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
          drawOnChartArea: false, // only want grid lines for one axis
        },
      },
    },
  };

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  return (
    <div className={commonStyles.dashboardSection}>
      <h3>
        {t('dashboard:sections.averageSalesByDay', 'Average Sales by Day of Week')}
        <span className={commonStyles.infoTooltip} data-tooltip={t('dashboard:tooltips.averageSalesByDay', 'Shows average sale count and revenue by day of the week.')}>?</span>
      </h3>
      <div className={styles.chartControls}>
        <div className={styles.controlGroup}>
          <label htmlFor="period">{t('dashboard:labels.period')}:</label>
          <select id="period" value={period} onChange={handlePeriodChange} className="period-select">
            <option value="month">{t('dashboard:periods.month')}</option>
            <option value="week">{t('dashboard:periods.week')}</option>
            <option value="year">{t('dashboard:periods.year')}</option>
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

export default AverageSalesByDayChart; 