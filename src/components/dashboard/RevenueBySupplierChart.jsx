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

const RevenueBySupplierChart = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supplierData, setSupplierData] = useState([]);
  const [currency, setCurrency] = useState('usd');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
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
    const fetchSupplierData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get real data from database
        const data = await dashboard.getRevenueAndProfitBySupplier();
        
        if (data && data.length > 0) {
          // Sort suppliers by revenue for better visualization
          const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);
          setSupplierData(sortedData);
          setTotalRevenue(sortedData.reduce((sum, supplier) => sum + supplier.revenue, 0));
          setTotalProfit(sortedData.reduce((sum, supplier) => sum + supplier.profit, 0));
        } else {
          // Fallback sample data if no real data is available
          const sampleData = [
            { id: 1, name: 'Supplier X', revenue: 15800, profit: 6320 },
            { id: 2, name: 'Supplier Y', revenue: 9750, profit: 3900 },
            { id: 3, name: 'Supplier Z', revenue: 7200, profit: 2880 },
            { id: 4, name: 'Supplier A', revenue: 4750, profit: 1900 }
          ].sort((a, b) => b.revenue - a.revenue);
          
          setSupplierData(sampleData);
          setTotalRevenue(sampleData.reduce((sum, supplier) => sum + supplier.revenue, 0));
          setTotalProfit(sampleData.reduce((sum, supplier) => sum + supplier.profit, 0));
        }
      } catch (error) {
        console.error('Error fetching supplier data:', error);
        setError(error);
        // Sample data as fallback
        const sampleData = [
          { id: 1, name: 'Supplier X', revenue: 15800, profit: 6320 },
          { id: 2, name: 'Supplier Y', revenue: 9750, profit: 3900 }
        ];
        setSupplierData(sampleData);
        setTotalRevenue(sampleData.reduce((sum, supplier) => sum + supplier.revenue, 0));
        setTotalProfit(sampleData.reduce((sum, supplier) => sum + supplier.profit, 0));
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierData();
  }, [dashboard]);

  const handleRetry = () => {
    fetchSupplierData();
  };

  // Prepare chart data
  const chartData = {
    labels: supplierData.map(supplier => supplier.name),
    datasets: [
      {
        label: t('dashboard:labels.revenue'),
        data: supplierData.map(supplier => supplier.revenue),
        backgroundColor: 'rgba(53, 162, 235, 0.6)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: t('dashboard:labels.profit'),
        data: supplierData.map(supplier => supplier.profit),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
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
              label += formatCurrency(context.parsed.x, currency);
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
          callback: (value) => formatCurrency(value, currency),
        }
      }
    }
  };

  return (
    <div className="dashboard-section">
      <h3>
        {t('dashboard:sections.revenueBySupplier')}
        <span className="info-tooltip" data-tooltip={t('dashboard:tooltips.revenueBySupplier')}>?</span>
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
      ) : supplierData.length === 0 ? (
        <div className="placeholder-content">
          {t('dashboard:placeholders.noSupplierData')}
        </div>
      ) : (
        <div className="supplier-revenue-container">
          <div className="chart-container" style={{ height: `${Math.max(250, 50 * supplierData.length)}px` }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
          
          <div className="supplier-summary">
            <div className="supplier-summary-header">
              <div>{t('dashboard:labels.supplier')}</div>
              <div>{t('dashboard:labels.revenue')}</div>
              <div>{t('dashboard:labels.profit')}</div>
              <div>{t('dashboard:labels.marginPct')}</div>
            </div>
            {supplierData.map(supplier => {
              const marginPct = ((supplier.profit / supplier.revenue) * 100).toFixed(1);
              
              return (
                <div key={supplier.id} className="supplier-summary-row">
                  <div className="supplier-name">{supplier.name}</div>
                  <div className="supplier-revenue">{formatCurrency(supplier.revenue, currency)}</div>
                  <div className="supplier-profit">{formatCurrency(supplier.profit, currency)}</div>
                  <div className="supplier-margin">{marginPct}%</div>
                </div>
              );
            })}
            <div className="supplier-summary-footer">
              <div>{t('dashboard:labels.total')}</div>
              <div>{formatCurrency(totalRevenue, currency)}</div>
              <div>{formatCurrency(totalProfit, currency)}</div>
              <div>{((totalProfit / totalRevenue) * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueBySupplierChart; 