import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import useSalesHistory from '../hooks/useSalesHistory';
import { SaleService } from '../services/DatabaseService';
import { calculateReturnTotal, formatCurrency } from '../utils/calculations';
import { toast } from 'react-hot-toast';
import '../styles/pages/sales-history.css';
import '../styles/components/modal.css';

const SalesHistory = () => {
  const { t } = useTranslation(['sales', 'common']);
  const {
    sales,
    loading,
    error,
    dateRange,
    paymentFilter,
    searchQuery,
    updateFilters,
    refresh
  } = useSalesHistory();

  const [tempDateRange, setTempDateRange] = useState(dateRange);
  const [tempPaymentFilter, setTempPaymentFilter] = useState('');
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedSaleDetails, setSelectedSaleDetails] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  
  // Return modal states
  const [returnItems, setReturnItems] = useState([]);
  const [returnNote, setReturnNote] = useState('');
  const [returnError, setReturnError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync filters when they change in the hook
  useEffect(() => {
    setTempDateRange(dateRange);
  }, [dateRange]);

  useEffect(() => {
    setTempPaymentFilter(paymentFilter);
  }, [paymentFilter]);

  useEffect(() => {
    setTempSearchQuery(searchQuery);
  }, [searchQuery]);

  // Initialize return items when a sale is selected
  useEffect(() => {
    if (selectedSale && selectedSale.items) {
      console.log('Selected sale items:', selectedSale.items);
      // Ensure we have the correct structure with returnQuantity initialized to 0
      setReturnItems(
        selectedSale.items.map(item => ({
          ...item,
          returnQuantity: 0
        }))
      );
      setReturnNote('');
      setReturnError('');
    }
  }, [selectedSale]);

  // Handle filter application
  const handleApplyFilters = () => {
    updateFilters({
      start: tempDateRange.start,
      end: tempDateRange.end,
      payment: tempPaymentFilter,
      query: tempSearchQuery
    });
  };

  // Load sale details when a sale is selected
  const handleSelectSale = async (sale) => {
    try {
      const saleDetails = await SaleService.getSaleById(sale.id);
      
      if (!saleDetails) {
        return;
      }
      
      setSelectedSaleDetails(saleDetails);
      setSelectedSale(saleDetails);
    } catch (err) {
      console.error('Error loading sale details:', err);
    }
  };

  // Reset selected sale
  const handleCloseDetails = () => {
    setSelectedSale(null);
    setSelectedSaleDetails(null);
  };

  // Open the return modal
  const openReturnModal = () => {
    setIsReturnModalOpen(true);
    document.body.classList.add('modal-open');
  };

  // Close the return modal
  const closeReturnModal = () => {
    setIsReturnModalOpen(false);
    document.body.classList.remove('modal-open');
  };

  // Handle quantity change in return modal
  const handleReturnQuantityChange = (itemId, quantity) => {
    setReturnItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              returnQuantity: Math.min(Math.max(0, parseInt(quantity) || 0), item.quantity) 
            } 
          : item
      )
    );
  };

  // Handle return submission
  const handleReturnSubmit = (e) => {
    e.preventDefault();
    
    const itemsToReturn = returnItems.filter(item => item.returnQuantity > 0);
    
    if (itemsToReturn.length === 0) {
      setReturnError(t('sales:return.errorNoItems'));
      return;
    }
    
    setReturnError('');
    setIsProcessing(true);
    
    // Process return logic
    const returnData = {
      saleId: selectedSale.id,
      items: itemsToReturn,
      note: returnNote,
      returnTotal: calculateReturnTotal(itemsToReturn),
      returnDate: new Date().toISOString()
    };
    
    // Simulate API call with a timeout
    setTimeout(() => {
      // Show notification that this is not implemented yet
      toast.success(t('sales:return.success'), { 
        duration: 2000,
        icon: '✅'
      });
      
      setTimeout(() => {
        toast(t('sales:return.notImplemented'), {
          duration: 4000,
          icon: 'ℹ️',
          style: {
            background: '#3498db',
            color: '#fff'
          }
        });
      }, 500);
      
      // Call the callback for processing the return
      handleReturnProcessed(returnData);
      setIsProcessing(false);
    }, 1000);
  };

  // Handle a processed return
  const handleReturnProcessed = (returnData) => {
    closeReturnModal();
    refresh(); // Refresh the sales list
    handleCloseDetails(); // Close the details panel
    // You could also show a success message here
  };

  // Render the sale item list
  const renderSaleItems = (items) => {
    if (!items || items.length === 0) {
      return <tr><td colSpan="4">No items found</td></tr>;
    }

    return items.map(item => (
      <tr key={item.id}>
        <td>{item.product_name}</td>
        <td>{item.quantity}</td>
        <td>{formatCurrency(item.unit_price)}</td>
        <td>{formatCurrency(item.total_price)}</td>
      </tr>
    ));
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  // Calculate return total
  const returnTotal = calculateReturnTotal(returnItems);

  return (
    <div className="sales-history-page">
      <div className="page-header">
        <h2>{t('sales:title')}</h2>
        <button 
          className="refresh-button" 
          onClick={refresh}
          disabled={loading}
        >
          {loading ? t('common:loading') : t('common:refresh')}
        </button>
      </div>

      <div className="sales-filters">
        <div className="date-filters">
          <div className="form-group">
            <label htmlFor="startDate">{t('sales:filters.from')}</label>
            <input 
              type="date" 
              id="startDate" 
              value={tempDateRange.start}
              onChange={(e) => setTempDateRange({ ...tempDateRange, start: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">{t('sales:filters.to')}</label>
            <input 
              type="date" 
              id="endDate" 
              value={tempDateRange.end}
              onChange={(e) => setTempDateRange({ ...tempDateRange, end: e.target.value })}
            />
          </div>
          <button className="filter-button" onClick={handleApplyFilters}>
            {t('sales:filters.apply')}
          </button>
        </div>

        <div className="additional-filters">
          <select 
            className="filter-select"
            value={tempPaymentFilter}
            onChange={(e) => {
              setTempPaymentFilter(e.target.value);
              updateFilters({ payment: e.target.value });
            }}
          >
            <option value="">{t('sales:filters.allPaymentMethods')}</option>
            <option value="cash">{t('sales:paymentMethods.cash')}</option>
            <option value="card">{t('sales:paymentMethods.card')}</option>
          </select>
          <input 
            type="text" 
            placeholder={t('sales:filters.searchPlaceholder')} 
            className="search-input"
            value={tempSearchQuery}
            onChange={(e) => {
              setTempSearchQuery(e.target.value);
              updateFilters({ query: e.target.value });
            }}
          />
        </div>
      </div>

      <div className="sales-container">
        <div className="sales-list">
          {loading ? (
            <div className="loading-state">{t('sales:loading')}</div>
          ) : error ? (
            <div className="error-state">{t('sales:error')}</div>
          ) : (
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
                {sales.length === 0 ? (
                  <tr className="empty-state">
                    <td colSpan="6">
                      <p>{t('sales:table.noRecords')}</p>
                    </td>
                  </tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id} className={selectedSale && selectedSale.id === sale.id ? 'selected' : ''}>
                      <td>{sale.receipt_number}</td>
                      <td>{formatDate(sale.created_at)}</td>
                      <td>{sale.item_count || '—'}</td>
                      <td>{formatCurrency(sale.total_amount)}</td>
                      <td>{t(`sales:paymentMethods.${sale.payment_method}`)}</td>
                      <td>
                        <button 
                          className="action-button view"
                          onClick={() => handleSelectSale(sale)}
                        >
                          {t('sales:actions.viewDetails')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {selectedSale && (
          <div className="sale-details">
            <div className="sale-details-header">
              <h3>{t('sales:details.title')} - {t('sales:receipt.number', { number: selectedSale.receipt_number })}</h3>
              <button className="close-button" onClick={handleCloseDetails}>×</button>
            </div>
            <div className="receipt">
              <div className="receipt-header">
                <h4>Inventory Pro</h4>
                <p>{t('sales:receipt.number', { number: selectedSale.receipt_number })}</p>
                <p>{formatDate(selectedSale.created_at)}</p>
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
                    {selectedSaleDetails && renderSaleItems(selectedSaleDetails.items)}
                  </tbody>
                </table>
              </div>
              <div className="receipt-summary">
                <div className="summary-row">
                  <span>{t('sales:receipt.subtotal')}:</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>{t('sales:receipt.tax')}:</span>
                  <span>{formatCurrency(selectedSale.tax_amount)}</span>
                </div>
                <div className="summary-row total">
                  <span>{t('sales:receipt.total')}:</span>
                  <span>{formatCurrency(selectedSale.total_amount)}</span>
                </div>
                <div className="summary-row">
                  <span>{t('sales:receipt.paymentMethod')}:</span>
                  <span>{t(`sales:paymentMethods.${selectedSale.payment_method}`)}</span>
                </div>
              </div>
              <div className="receipt-actions">
                <button 
                  className="button secondary" 
                  onClick={() => window.print()} 
                  disabled={!selectedSale}
                >
                  {t('sales:actions.printReceipt')}
                </button>
                <button 
                  className="button primary" 
                  onClick={openReturnModal} 
                  disabled={!selectedSale}
                >
                  {t('sales:actions.processReturn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Return Modal - Now inline like in POS page */}
      {isReturnModalOpen && selectedSale && (
        <div className="modal-overlay">
          <div className="modal return-modal">
            <div className="modal-header">
              <h3>{t('sales:return.title')} - {t('sales:receipt.number', { number: selectedSale.receipt_number })}</h3>
              <button className="close-button" onClick={closeReturnModal}>×</button>
            </div>
            
            <form onSubmit={handleReturnSubmit}>
              <div className="modal-body">
                {returnError && <div className="error-message">{returnError}</div>}
                
                <div className="return-info">
                  {t('sales:return.receiptInfo', { 
                    number: selectedSale.receipt_number, 
                    date: formatDate(selectedSale.created_at) 
                  })}
                </div>
                
                <div className="return-items">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('sales:receipt.item')}</th>
                        <th>{t('sales:receipt.price')}</th>
                        <th>{t('sales:return.originalQuantity')}</th>
                        <th>{t('sales:return.returnQuantity')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.product_name || item.name}</td>
                          <td>{formatCurrency(item.unit_price || item.price || 0)}</td>
                          <td>{item.quantity}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={item.returnQuantity || 0}
                              onChange={(e) => handleReturnQuantityChange(item.id, e.target.value)}
                              disabled={isProcessing}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="return-note">
                  <label htmlFor="return-note">{t('sales:return.note')}:</label>
                  <textarea
                    id="return-note"
                    value={returnNote}
                    onChange={(e) => setReturnNote(e.target.value)}
                    placeholder={t('sales:return.notePlaceholder')}
                    required
                    disabled={isProcessing}
                  />
                </div>
                
                <div className="return-summary">
                  <div className="return-total">
                    <span>{t('sales:return.totalRefund')}:</span>
                    <span>{formatCurrency(returnTotal)}</span>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="button secondary" 
                  onClick={closeReturnModal}
                  disabled={isProcessing}
                >
                  {t('common:cancel')}
                </button>
                <button 
                  type="submit" 
                  className="button primary" 
                  disabled={isProcessing || returnTotal <= 0}
                >
                  {isProcessing ? t('common:processing') : t('sales:return.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
