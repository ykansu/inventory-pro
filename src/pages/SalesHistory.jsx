import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const SalesHistory = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSale, setSelectedSale] = useState(null);
  const { t } = useTranslation(['sales', 'common']);

  return (
    <div className="sales-history-page">
      <div className="page-header">
        <h2>{t('sales:title')}</h2>
      </div>

      <div className="sales-filters">
        <div className="date-filters">
          <div className="form-group">
            <label htmlFor="startDate">{t('sales:filters.from')}</label>
            <input 
              type="date" 
              id="startDate" 
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">{t('sales:filters.to')}</label>
            <input 
              type="date" 
              id="endDate" 
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <button className="filter-button">{t('sales:filters.apply')}</button>
        </div>

        <div className="additional-filters">
          <select className="filter-select">
            <option value="">{t('sales:filters.allPaymentMethods')}</option>
            <option value="cash">{t('sales:paymentMethods.cash')}</option>
            <option value="card">{t('sales:paymentMethods.card')}</option>
          </select>
          <input 
            type="text" 
            placeholder={t('sales:filters.searchPlaceholder')} 
            className="search-input"
          />
        </div>
      </div>

      <div className="sales-container">
        <div className="sales-list">
          <table className="sales-table">
            <thead>
              <tr>
                <th>{t('sales:table.headers.receipt')}</th>
                <th>{t('sales:table.headers.dateTime')}</th>
                <th>{t('sales:table.headers.items')}</th>
                <th>{t('sales:table.headers.total')}</th>
                <th>{t('sales:table.headers.payment')}</th>
                <th>{t('sales:table.headers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="empty-state">
                <td colSpan="6">
                  <p>{t('sales:table.noRecords')}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {selectedSale && (
          <div className="sale-details">
            <div className="sale-details-header">
              <h3>{t('sales:details.title')}</h3>
              <button className="close-button" onClick={() => setSelectedSale(null)}>×</button>
            </div>
            <div className="receipt">
              <div className="receipt-header">
                <h4>Inventory Pro</h4>
                <p>{t('sales:receipt.number', { number: selectedSale.receiptNumber })}</p>
                <p>{selectedSale.date}</p>
              </div>
              <div className="receipt-items">
                <table>
                  <thead>
                    <tr>
                      <th>{t('sales:receipt.item')}</th>
                      <th>{t('sales:receipt.quantity')}</th>
                      <th>{t('sales:receipt.price')}</th>
                      <th>{t('sales:receipt.total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Receipt items will be dynamically generated here */}
                  </tbody>
                </table>
              </div>
              <div className="receipt-summary">
                <div className="summary-row">
                  <span>{t('sales:receipt.subtotal')}:</span>
                  <span>$0.00</span>
                </div>
                <div className="summary-row">
                  <span>{t('sales:receipt.tax')}:</span>
                  <span>$0.00</span>
                </div>
                <div className="summary-row total">
                  <span>{t('sales:receipt.total')}:</span>
                  <span>$0.00</span>
                </div>
                <div className="summary-row">
                  <span>{t('sales:receipt.paymentMethod')}:</span>
                  <span>{t('sales:paymentMethods.cash')}</span>
                </div>
              </div>
              <div className="receipt-actions">
                <button className="button secondary">{t('sales:actions.printReceipt')}</button>
                <button className="button primary">{t('sales:actions.processReturn')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesHistory;
