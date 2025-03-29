import React, { useState } from 'react';

const Reports = () => {
  const [reportType, setReportType] = useState('daily');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>Reports</h2>
      </div>

      <div className="reports-container">
        <div className="report-sidebar">
          <h3>Report Types</h3>
          <ul className="report-types">
            <li>
              <button 
                className={`report-type-button ${reportType === 'daily' ? 'active' : ''}`}
                onClick={() => setReportType('daily')}
              >
                Daily Sales (Z-Report)
              </button>
            </li>
            <li>
              <button 
                className={`report-type-button ${reportType === 'inventory' ? 'active' : ''}`}
                onClick={() => setReportType('inventory')}
              >
                Inventory Valuation
              </button>
            </li>
            <li>
              <button 
                className={`report-type-button ${reportType === 'lowStock' ? 'active' : ''}`}
                onClick={() => setReportType('lowStock')}
              >
                Low Stock Report
              </button>
            </li>
            <li>
              <button 
                className={`report-type-button ${reportType === 'topSelling' ? 'active' : ''}`}
                onClick={() => setReportType('topSelling')}
              >
                Top Selling Products
              </button>
            </li>
            <li>
              <button 
                className={`report-type-button ${reportType === 'profitMargin' ? 'active' : ''}`}
                onClick={() => setReportType('profitMargin')}
              >
                Profit Margin Analysis
              </button>
            </li>
          </ul>
        </div>

        <div className="report-content">
          <div className="report-filters">
            <div className="date-filters">
              <div className="form-group">
                <label htmlFor="startDate">From</label>
                <input 
                  type="date" 
                  id="startDate" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">To</label>
                <input 
                  type="date" 
                  id="endDate" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
              <button className="filter-button">Generate Report</button>
            </div>

            <div className="export-options">
              <button className="export-button">Export to CSV</button>
              <button className="print-button">Print Report</button>
            </div>
          </div>

          <div className="report-display">
            {reportType === 'daily' && (
              <div className="daily-report">
                <h3>Daily Sales Report (Z-Report)</h3>
                <p className="report-date">For period: {dateRange.start || 'Not selected'} to {dateRange.end || 'Not selected'}</p>
                
                <div className="report-summary">
                  <div className="summary-card">
                    <h4>Total Sales</h4>
                    <div className="summary-value">$0.00</div>
                  </div>
                  <div className="summary-card">
                    <h4>Number of Transactions</h4>
                    <div className="summary-value">0</div>
                  </div>
                  <div className="summary-card">
                    <h4>Average Transaction Value</h4>
                    <div className="summary-value">$0.00</div>
                  </div>
                  <div className="summary-card">
                    <h4>Gross Profit</h4>
                    <div className="summary-value">$0.00</div>
                  </div>
                </div>

                <div className="report-section">
                  <h4>Payment Method Breakdown</h4>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Payment Method</th>
                        <th>Amount</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="empty-state">
                        <td colSpan="3">
                          <p>No data available for the selected period.</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="report-section">
                  <h4>Sales by Category</h4>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Items Sold</th>
                        <th>Total Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="empty-state">
                        <td colSpan="3">
                          <p>No data available for the selected period.</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportType !== 'daily' && (
              <div className="placeholder-report">
                <h3>{reportType === 'inventory' ? 'Inventory Valuation Report' : 
                    reportType === 'lowStock' ? 'Low Stock Report' :
                    reportType === 'topSelling' ? 'Top Selling Products Report' :
                    'Profit Margin Analysis'}</h3>
                <div className="placeholder-content">
                  <p>Select a date range and click "Generate Report" to view this report.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
