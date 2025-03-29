import React, { useState } from 'react';

const SalesHistory = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSale, setSelectedSale] = useState(null);

  return (
    <div className="sales-history-page">
      <div className="page-header">
        <h2>Sales History</h2>
      </div>

      <div className="sales-filters">
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
          <button className="filter-button">Apply Filter</button>
        </div>

        <div className="additional-filters">
          <select className="filter-select">
            <option value="">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
          <input 
            type="text" 
            placeholder="Search by receipt #" 
            className="search-input"
          />
        </div>
      </div>

      <div className="sales-container">
        <div className="sales-list">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Date & Time</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="empty-state">
                <td colSpan="6">
                  <p>No sales records found for the selected period.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {selectedSale && (
          <div className="sale-details">
            <div className="sale-details-header">
              <h3>Sale Details</h3>
              <button className="close-button" onClick={() => setSelectedSale(null)}>×</button>
            </div>
            <div className="receipt">
              <div className="receipt-header">
                <h4>Inventory Pro</h4>
                <p>Receipt #{selectedSale.receiptNumber}</p>
                <p>{selectedSale.date}</p>
              </div>
              <div className="receipt-items">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Receipt items will be dynamically generated here */}
                  </tbody>
                </table>
              </div>
              <div className="receipt-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>$0.00</span>
                </div>
                <div className="summary-row">
                  <span>Tax:</span>
                  <span>$0.00</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>$0.00</span>
                </div>
                <div className="summary-row">
                  <span>Payment Method:</span>
                  <span>Cash</span>
                </div>
              </div>
              <div className="receipt-actions">
                <button className="button secondary">Print Receipt</button>
                <button className="button primary">Process Return</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesHistory;
