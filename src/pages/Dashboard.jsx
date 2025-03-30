import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useDatabase } from '../context/DatabaseContext';
import { SaleService } from '../services/DatabaseService';
// Add imports for any visualization libraries if needed
// import { PieChart, LineChart } from 'your-chart-library';

const Dashboard = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { settings, isLoading } = useDatabase();
  
  // Settings state
  const [appSettings, setAppSettings] = useState({
    currency: 'usd',
    dateFormat: 'mm/dd/yyyy',
    businessName: 'Inventory Pro Store'
  });
  
  // State for each dashboard metric
  const [inventoryMetrics, setInventoryMetrics] = useState({
    turnoverRate: 0,
    totalValue: 0,
    lowStockCount: 0,
    stockVariance: 0
  });
  
  const [salesMetrics, setSalesMetrics] = useState({
    todaySales: 0,
    monthlyRevenue: 0,
    monthlyProfit: 0,
    profitMargin: 0,
    revenueByPaymentMethod: {},
    topProducts: [],
    revenueBySupplier: []
  });
  
  const [supplierMetrics, setSupplierMetrics] = useState({
    onTimeDelivery: 0,
    qualityScore: 0,
    topSuppliers: []
  });
  
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [categoryProfits, setCategoryProfits] = useState([]);
  const [inventoryValueTrend, setInventoryValueTrend] = useState([]);
  const [revenueValueTrend, setRevenueValueTrend] = useState([]);
  const [profitValueTrend, setProfitValueTrend] = useState([]);
  
  // Load settings first
  useEffect(() => {
    if (!isLoading && settings) {
      loadSettings();
    }
  }, [isLoading, settings]);
  
  // Fetch data on component mount
  useEffect(() => {
    // These would be API calls to your backend
    fetchInventoryMetrics();
    fetchSalesMetrics();
    fetchSupplierMetrics();
    fetchCategoryBreakdown();
    fetchCategoryProfits();
    fetchInventoryValueTrend();
    fetchRevenueValueTrend();
    fetchProfitValueTrend();
  }, []);
  
  // Load settings from context
  const loadSettings = async () => {
    try {
      const settingsObj = await settings.getAllSettings();
      
      setAppSettings({
        currency: settingsObj.currency?.toLowerCase() || 'usd',
        dateFormat: settingsObj.date_format || 'mm/dd/yyyy',
        businessName: settingsObj.business_name || 'Inventory Pro Store'
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };
  
  // Format currency based on settings
  const formatCurrency = (amount) => {
    const currencySymbols = {
      usd: '$',
      eur: '€',
      gbp: '£',
      try: '₺'
    };
    
    const symbol = currencySymbols[appSettings.currency] || '$';
    return `${symbol}${amount.toLocaleString()}`;
  };
  
  // Functions to fetch data from backend
  const fetchInventoryMetrics = async () => {
    // API call to calculate metrics from stock_adjustments and products tables
    // For now using placeholder data
    setInventoryMetrics({
      turnoverRate: 4.2, // Times inventory turns over per year
      totalValue: 24500, // Total inventory value
      lowStockCount: 8, // Items below threshold
      stockVariance: 2.3 // % difference between expected and actual stock
    });
  };
  
  const fetchSalesMetrics = async () => {
    try {
      // Get actual profit metrics from the backend
      const profitMetrics = await SaleService.getMonthlyProfitMetrics();
      
      // Update sales metrics with actual data from backend
      setSalesMetrics({
        todaySales: 1250, // This would come from a different API endpoint
        monthlyRevenue: profitMetrics.monthlyRevenue,
        monthlyProfit: profitMetrics.monthlyProfit,
        profitMargin: profitMetrics.profitMargin,
        revenueByPaymentMethod: {
          cash: 12500,
          credit: 15000,
          online: 10000
        },
        topProducts: [
          { id: 1, name: 'Product A', sales: 120 },
          { id: 2, name: 'Product B', sales: 85 },
          { id: 3, name: 'Product C', sales: 64 },
          { id: 4, name: 'Product D', sales: 52 },
          { id: 5, name: 'Product E', sales: 43 }
        ],
        revenueBySupplier: [
          { id: 1, name: 'Supplier X', revenue: 15800 },
          { id: 2, name: 'Supplier Y', revenue: 9750 },
          { id: 3, name: 'Supplier Z', revenue: 7200 },
          { id: 4, name: 'Supplier A', revenue: 4750 }
        ]
      });
    } catch (error) {
      console.error('Error fetching sales metrics:', error);
      // Fallback to default data if API call fails
      setSalesMetrics({
        todaySales: 1250,
        monthlyRevenue: 37500,
        monthlyProfit: 14250,
        profitMargin: 38,
        revenueByPaymentMethod: {
          cash: 12500,
          credit: 15000,
          online: 10000
        },
        topProducts: [
          { id: 1, name: 'Product A', sales: 120 },
          { id: 2, name: 'Product B', sales: 85 },
          { id: 3, name: 'Product C', sales: 64 },
          { id: 4, name: 'Product D', sales: 52 },
          { id: 5, name: 'Product E', sales: 43 }
        ],
        revenueBySupplier: [
          { id: 1, name: 'Supplier X', revenue: 15800 },
          { id: 2, name: 'Supplier Y', revenue: 9750 },
          { id: 3, name: 'Supplier Z', revenue: 7200 },
          { id: 4, name: 'Supplier A', revenue: 4750 }
        ]
      });
    }
  };
  
  const fetchSupplierMetrics = async () => {
    // API call for supplier performance data
    setSupplierMetrics({
      onTimeDelivery: 87, // Percentage
      qualityScore: 92, // Percentage
      topSuppliers: [
        { id: 1, name: 'Supplier X', performance: 95 },
        { id: 2, name: 'Supplier Y', performance: 88 },
        { id: 3, name: 'Supplier Z', performance: 82 }
      ]
    });
  };
  
  const fetchCategoryBreakdown = async () => {
    // API call to get category data
    setCategoryBreakdown([
      { name: 'Category A', count: 42, value: 8500 },
      { name: 'Category B', count: 28, value: 6200 },
      { name: 'Category C', count: 35, value: 5100 },
      { name: 'Category D', count: 15, value: 4700 }
    ]);
  };

  const fetchCategoryProfits = async () => {
    try {
      // Get actual category profit data from backend
      const categoryProfitData = await SaleService.getCategoryProfits();
      
      if (categoryProfitData.length > 0) {
        setCategoryProfits(categoryProfitData);
      } else {
        // Fallback to placeholder data if no data is returned
        setCategoryProfits([
          { name: 'Category A', revenue: 12500, cost: 7200, profit: 5300, margin: 42.4 },
          { name: 'Category B', revenue: 9800, cost: 5900, profit: 3900, margin: 39.8 },
          { name: 'Category C', revenue: 8300, cost: 4700, profit: 3600, margin: 43.4 },
          { name: 'Category D', revenue: 6900, cost: 4650, profit: 2250, margin: 32.6 }
        ]);
      }
    } catch (error) {
      console.error('Error fetching category profits:', error);
      // Fallback to placeholder data if API call fails
      setCategoryProfits([
        { name: 'Category A', revenue: 12500, cost: 7200, profit: 5300, margin: 42.4 },
        { name: 'Category B', revenue: 9800, cost: 5900, profit: 3900, margin: 39.8 },
        { name: 'Category C', revenue: 8300, cost: 4700, profit: 3600, margin: 43.4 },
        { name: 'Category D', revenue: 6900, cost: 4650, profit: 2250, margin: 32.6 }
      ]);
    }
  };
  
  const fetchInventoryValueTrend = async () => {
    // API call for historical inventory value
    setInventoryValueTrend([
      { month: 'Jan', value: 22000 },
      { month: 'Feb', value: 23400 },
      { month: 'Mar', value: 21800 },
      { month: 'Apr', value: 24500 }
    ]);
  };

  const fetchRevenueValueTrend = async () => {
    // API call for historical revenue value
    setRevenueValueTrend([
      { month: 'Jan', value: 28000 },
      { month: 'Feb', value: 32400 },
      { month: 'Mar', value: 29800 },
      { month: 'Apr', value: 37500 },
      { month: 'May', value: 34200 },
      { month: 'Jun', value: 38900 }
    ]);
  };

  const fetchProfitValueTrend = async () => {
    try {
      // Get actual profit trend data from backend
      const profitTrendData = await SaleService.getProfitValueTrend();
      
      if (profitTrendData.length > 0) {
        setProfitValueTrend(profitTrendData);
      } else {
        // Fallback to placeholder data if no data is returned
        setProfitValueTrend([
          { month: 'Jan', value: 10640 },
          { month: 'Feb', value: 12636 },
          { month: 'Mar', value: 11324 },
          { month: 'Apr', value: 14250 },
          { month: 'May', value: 13338 },
          { month: 'Jun', value: 15600 }
        ]);
      }
    } catch (error) {
      console.error('Error fetching profit trend data:', error);
      // Fallback to placeholder data if API call fails
      setProfitValueTrend([
        { month: 'Jan', value: 10640 },
        { month: 'Feb', value: 12636 },
        { month: 'Mar', value: 11324 },
        { month: 'Apr', value: 14250 },
        { month: 'May', value: 13338 },
        { month: 'Jun', value: 15600 }
      ]);
    }
  };

  // Get tooltip explanations for metrics
  const getTooltip = (metric) => {
    const tooltips = {
      totalProducts: t('dashboard:tooltips.totalProducts'),
      lowStockItems: t('dashboard:tooltips.lowStockItems'),
      todaySales: t('dashboard:tooltips.todaySales'),
      monthlyRevenue: t('dashboard:tooltips.monthlyRevenue'),
      monthlyProfit: t('dashboard:tooltips.monthlyProfit'),
      profitMargin: t('dashboard:tooltips.profitMargin'),
      inventoryTurnover: t('dashboard:tooltips.inventoryTurnover'),
      inventoryValue: t('dashboard:tooltips.inventoryValue'),
      stockVariance: t('dashboard:tooltips.stockVariance'),
      supplierPerformance: t('dashboard:tooltips.supplierPerformance'),
      topProducts: t('dashboard:tooltips.topProducts'),
      revenueBySupplier: t('dashboard:tooltips.revenueBySupplier'),
      revenueByPayment: t('dashboard:tooltips.revenueByPayment'),
      categoryBreakdown: t('dashboard:tooltips.categoryBreakdown'),
      categoryProfits: t('dashboard:tooltips.categoryProfits'),
      inventoryTrend: t('dashboard:tooltips.inventoryTrend'),
      revenueTrend: t('dashboard:tooltips.revenueTrend'),
      profitTrend: t('dashboard:tooltips.profitTrend')
    };
    
    return tooltips[metric] || '';
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>{t('dashboard:overview')}</h2>
        <p>{t('dashboard:welcome')}</p>
        <div className="business-name">{appSettings.businessName}</div>
      </div>
      
      {/* Key Performance Metrics */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>
            {t('dashboard:stats.totalProducts')}
            <span className="info-tooltip" title={getTooltip('totalProducts')}>ⓘ</span>
          </h3>
          <div className="stat-value">
            {categoryBreakdown.reduce((sum, category) => sum + category.count, 0)}
          </div>
        </div>
        
        <div className="stat-card">
          <h3>
            {t('dashboard:stats.lowStockItems')}
            <span className="info-tooltip" title={getTooltip('lowStockItems')}>ⓘ</span>
          </h3>
          <div className="stat-value">{inventoryMetrics.lowStockCount}</div>
        </div>
        
        <div className="stat-card">
          <h3>
            {t('dashboard:stats.todaySales')}
            <span className="info-tooltip" title={getTooltip('todaySales')}>ⓘ</span>
          </h3>
          <div className="stat-value">
            {formatCurrency(salesMetrics.todaySales)}
          </div>
        </div>
        
        <div className="stat-card">
          <h3>
            {t('dashboard:stats.monthlyRevenue')}
            <span className="info-tooltip" title={getTooltip('monthlyRevenue')}>ⓘ</span>
          </h3>
          <div className="stat-value">
            {formatCurrency(salesMetrics.monthlyRevenue)}
          </div>
        </div>
        
        <div className="stat-card">
          <h3>
            {t('dashboard:stats.monthlyProfit')}
            <span className="info-tooltip" title={getTooltip('monthlyProfit')}>ⓘ</span>
          </h3>
          <div className="stat-value">
            {formatCurrency(salesMetrics.monthlyProfit)}
          </div>
        </div>
        
        <div className="stat-card">
          <h3>
            {t('dashboard:stats.profitMargin')}
            <span className="info-tooltip" title={getTooltip('profitMargin')}>ⓘ</span>
          </h3>
          <div className="stat-value">{salesMetrics.profitMargin}%</div>
        </div>
        
        <div className="stat-card">
          <h3>
            {t('dashboard:stats.inventoryTurnover')}
            <span className="info-tooltip" title={getTooltip('inventoryTurnover')}>ⓘ</span>
          </h3>
          <div className="stat-value">{inventoryMetrics.turnoverRate.toFixed(1)}x</div>
        </div>
        
        <div className="stat-card">
          <h3>
            {t('dashboard:stats.inventoryValue')}
            <span className="info-tooltip" title={getTooltip('inventoryValue')}>ⓘ</span>
          </h3>
          <div className="stat-value">
            {formatCurrency(inventoryMetrics.totalValue)}
          </div>
        </div>
        
        <div className="stat-card">
          <h3>
            {t('dashboard:stats.stockVariance')}
            <span className="info-tooltip" title={getTooltip('stockVariance')}>ⓘ</span>
          </h3>
          <div className="stat-value">{inventoryMetrics.stockVariance.toFixed(1)}%</div>
        </div>
        
        <div className="stat-card">
          <h3>
            {t('dashboard:stats.supplierPerformance')}
            <span className="info-tooltip" title={getTooltip('supplierPerformance')}>ⓘ</span>
          </h3>
          <div className="stat-value">{supplierMetrics.onTimeDelivery}%</div>
        </div>
      </div>
      
      {/* Dashboard Sections */}
      <div className="dashboard-sections">
        {/* Profit Trend Chart */}
        <div className="dashboard-section">
          <h3>
            {t('dashboard:sections.profitTrend')}
            <span className="info-tooltip" title={getTooltip('profitTrend')}>ⓘ</span>
          </h3>
          <div className="chart-container">
            {profitValueTrend.length > 0 && revenueValueTrend.length > 0 ? (
              <div className="trend-chart profit-trend-chart">
                <div className="trend-bars">
                  {profitValueTrend.map((point, index) => (
                    <div key={index} className="trend-bar-container">
                      <div className="trend-bar-stacked">
                        {/* Revenue bar (full height) */}
                        <div 
                          className="trend-bar revenue-bar" 
                          style={{ 
                            height: `${(revenueValueTrend[index]?.value / Math.max(...revenueValueTrend.map(p => p.value))) * 100}%`
                          }}
                        />
                        {/* Profit bar (partial height) */}
                        <div 
                          className="trend-bar profit-bar" 
                          style={{ 
                            height: `${(point.value / Math.max(...revenueValueTrend.map(p => p.value))) * 100}%`
                          }}
                        />
                      </div>
                      <div className="trend-label">{point.month}</div>
                      <div className="trend-values">
                        <div className="trend-value revenue-value">
                          {formatCurrency(revenueValueTrend[index]?.value)}
                        </div>
                        <div className="trend-value profit-value">
                          {formatCurrency(point.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="trend-legend">
                  <div className="legend-item">
                    <span className="legend-color revenue-color"></span>
                    <span className="legend-label">{t('dashboard:labels.revenue')}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color profit-color"></span>
                    <span className="legend-label">{t('dashboard:labels.profit')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="placeholder-content">{t('dashboard:placeholders.noTrendData')}</p>
            )}
          </div>
        </div>
        
        {/* Category Profits */}
        <div className="dashboard-section">
          <h3>
            {t('dashboard:sections.categoryProfits')}
            <span className="info-tooltip" title={getTooltip('categoryProfits')}>ⓘ</span>
          </h3>
          <div className="chart-container">
            {categoryProfits.length > 0 ? (
              <div className="category-profit-container">
                {categoryProfits.map(category => (
                  <div key={category.name} className="category-profit-item">
                    <div className="category-profit-header">
                      <span className="category-name">{category.name}</span>
                      <span className="category-margin">{category.margin.toFixed(1)}%</span>
                    </div>
                    <div className="profit-bars-container">
                      <div className="stacked-bar-container">
                        {/* Cost bar */}
                        <div 
                          className="profit-cost-bar" 
                          style={{ width: `${(category.cost / category.revenue) * 100}%` }}
                        />
                        {/* Profit bar */}
                        <div 
                          className="profit-margin-bar" 
                          style={{ width: `${(category.profit / category.revenue) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="category-profit-details">
                      <div>
                        <span className="detail-label">{t('dashboard:labels.revenue')}</span>
                        <span className="detail-value">{formatCurrency(category.revenue)}</span>
                      </div>
                      <div>
                        <span className="detail-label">{t('dashboard:labels.profit')}</span>
                        <span className="detail-value">{formatCurrency(category.profit)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="placeholder-content">{t('dashboard:placeholders.noCategoryData')}</p>
            )}
          </div>
        </div>
        
        {/* Top Products */}
        <div className="dashboard-section">
          <h3>
            {t('dashboard:sections.topProducts')}
            <span className="info-tooltip" title={getTooltip('topProducts')}>ⓘ</span>
          </h3>
          <div className="content-table">
            {salesMetrics.topProducts.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {salesMetrics.topProducts.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.sales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="placeholder-content">{t('dashboard:placeholders.noProductData')}</p>
            )}
          </div>
        </div>
        
        {/* Revenue by Supplier */}
        <div className="dashboard-section">
          <h3>
            {t('dashboard:sections.revenueBySupplier')}
            <span className="info-tooltip" title={getTooltip('revenueBySupplier')}>ⓘ</span>
          </h3>
          <div className="content-table">
            {salesMetrics.revenueBySupplier.length > 0 ? (
              <div className="supplier-revenue-container">
                {salesMetrics.revenueBySupplier.map(supplier => (
                  <div key={supplier.id} className="supplier-revenue-item">
                    <div className="supplier-revenue-header">
                      <span className="supplier-name">{supplier.name}</span>
                      <span className="supplier-revenue">{formatCurrency(supplier.revenue)}</span>
                    </div>
                    <div className="supplier-revenue-bar-container">
                      <div 
                        className="supplier-revenue-bar" 
                        style={{ 
                          width: `${(supplier.revenue / salesMetrics.revenueBySupplier.reduce((sum, s) => sum + s.revenue, 0)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="placeholder-content">{t('dashboard:placeholders.noSupplierData')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
