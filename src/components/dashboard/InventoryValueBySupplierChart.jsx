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

const InventoryValueBySupplierChart = () => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supplierData, setSupplierData] = useState([]);
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
    const fetchInventoryValueBySupplier = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get real data from database
        const data = await dashboard.getInventoryValueBySupplier();
        
        if (data && data.length > 0) {
          setSupplierData(data);
        } else {
          setSupplierData([]);
        }
      } catch (error) {
        console.error('Error fetching inventory value by supplier:', error);
        setError(error);
        setSupplierData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryValueBySupplier();
  }, [dashboard]);

  const handleRetry = () => {
    const fetchInventoryValueBySupplier = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get real data from database
        const data = await dashboard.getInventoryValueBySupplier();
        
        if (data && data.length > 0) {
          setSupplierData(data);
        } else {
          setSupplierData([]);
        }
      } catch (error) {
        console.error('Error fetching inventory value by supplier:', error);
        setError(error);
        setSupplierData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryValueBySupplier();
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
  
  const { backgroundColors, borderColorsArray } = generateColors(supplierData.length);

  // Calculate total inventory value
  const totalInventoryValue = supplierData.reduce((sum, supplier) => sum + supplier.value, 0);

  // Prepare data for Pie chart
  const pieChartData = {
    labels: supplierData.map(supplier => supplier.name),
    datasets: [
      {
        label: t('dashboard:labels.inventoryValue'),
        data: supplierData.map(supplier => supplier.value),
        backgroundColor: backgroundColors,
        borderColor: borderColorsArray,
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for Bar chart
  const barChartData = {
    labels: supplierData.map(supplier => supplier.name),
    datasets: [
      {
        label: t('dashboard:labels.inventoryValue'),
        data: supplierData.map(supplier => supplier.value),
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
        ticks: {
          callback: (value) => formatCurrency(value, currency),
        }
      }
    } : undefined
  };

  return (
    <div className="dashboard-section">
      <h3>
        {t('dashboard:sections.inventoryValueBySupplier')}
        <span className="info-tooltip" data-tooltip={t('dashboard:tooltips.inventoryValueBySupplier')}>?</span>
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
        <div className="supplier-value-container">
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
          
          <div className="supplier-details-table">
            <div className="supplier-details-header">
              <div className="details-cell">{t('dashboard:labels.supplier')}</div>
              <div className="details-cell">{t('dashboard:labels.inventoryValue')}</div>
              <div className="details-cell">{t('dashboard:labels.quantity')}</div>
              <div className="details-cell">{t('dashboard:labels.percentage')}</div>
            </div>
            {supplierData.map((supplier, index) => {
              const percentage = ((supplier.value / totalInventoryValue) * 100).toFixed(1);
              
              return (
                <div key={`supplier-${index}-${supplier.name}`} className="supplier-details-row">
                  <div className="details-cell">{supplier.name}</div>
                  <div className="details-cell">{formatCurrency(supplier.value, currency)}</div>
                  <div className="details-cell">{supplier.productCount}</div>
                  <div className="details-cell">{percentage}%</div>
                </div>
              );
            })}
            <div className="supplier-details-footer">
              <div className="details-cell">{t('dashboard:labels.total')}</div>
              <div className="details-cell">{formatCurrency(totalInventoryValue, currency)}</div>
              <div className="details-cell">{supplierData.reduce((sum, item) => sum + item.productCount, 0)}</div>
              <div className="details-cell">100%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryValueBySupplierChart; 