import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import useSalesHistory from '../hooks/useSalesHistory';
import { SaleService, ProductService } from '../services/DatabaseService';
import { calculateReturnTotal, formatCurrency } from '../utils/calculations';
import { printReceipt } from '../utils/receiptPrinter';
import { toast } from 'react-hot-toast';
import '../styles/pages/sales-history.css';
import '../styles/components/modal.css';
import { format } from 'date-fns';
import { useDatabase } from '../context/DatabaseContext';
import { useSettings } from '../context/SettingsContext';

// Inline styles for unit display
const styles = {
  unitName: {
    fontSize: '0.75rem',
    color: '#4b5563',
    marginLeft: '0.25rem',
    whiteSpace: 'nowrap'
  }
};

const SalesHistory = () => {
  const { t } = useTranslation(['sales', 'common', 'pos', 'products']);
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
  const { products } = useDatabase();
  const { 
    getCurrency, 
    getDateFormat, 
    getBusinessName,
    getBusinessAddress,
    getBusinessPhone,
    getBusinessEmail,
    getReceiptHeader,
    getReceiptFooter
  } = useSettings();

  const [tempDateRange, setTempDateRange] = useState(dateRange);
  const [tempPaymentFilter, setTempPaymentFilter] = useState('');
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedSaleDetails, setSelectedSaleDetails] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isCancelConfirmModalOpen, setIsCancelConfirmModalOpen] = useState(false);
  
  // Return modal states
  const [returnItems, setReturnItems] = useState([]);
  const [returnNote, setReturnNote] = useState('');
  const [returnError, setReturnError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper function to format currency consistently
  const formatWithCurrency = (amount) => {
    return formatCurrency(amount, getCurrency());
  };

  // Format dates according to user settings
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    switch (getDateFormat()) {
      case 'dd/mm/yyyy':
        return format(date, 'dd/MM/yyyy HH:mm');
      case 'yyyy-mm-dd':
        return format(date, 'yyyy-MM-dd HH:mm');
      case 'mm/dd/yyyy':
      default:
        return format(date, 'MM/dd/yyyy HH:mm');
    }
  };

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
      
      // For each sale item, try to fetch the product details to get the unit
      const enhancedItems = await Promise.all(
        saleDetails.items.map(async (item) => {
          try {
            // Try to get the product data for the unit
            const product = await ProductService.getProductById(item.product_id);
            return {
              ...item,
              product: product || { unit: 'units' } // Add product info with fallback unit
            };
          } catch (error) {
            console.error(`Error loading product details for item ${item.id}:`, error);
            return {
              ...item,
              product: { unit: 'units' } // Fallback unit if product can't be loaded
            };
          }
        })
      );
      
      // Update the sale details with enhanced items
      const enhancedSaleDetails = {
        ...saleDetails,
        items: enhancedItems
      };
      
      setSelectedSaleDetails(enhancedSaleDetails);
      setSelectedSale(enhancedSaleDetails);
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
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    
    // Verify at least one item is being returned
    const hasReturns = returnItems.some(item => item.returnQuantity > 0);
    if (!hasReturns) {
      toast.error(t('sales:return.noItemsSelected'));
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Calculate amounts for the items being returned
      const amounts = calculateReturnAmount(returnItems);
      
      // Prepare return data
      const returnData = {
        date: new Date().toISOString(),
        reason: returnNote,
        subtotal: amounts.subtotal,
        total_amount: amounts.total,
        reference: selectedSale.id
      };
      
      // Filter items that have a return quantity
      const itemsToReturn = returnItems
        .filter(item => item.returnQuantity > 0)
        .map(item => ({
          product_id: item.product_id,
          quantity: item.returnQuantity,
          unit_price: item.unit_price,
          total_price: item.returnQuantity * item.unit_price
        }));
      
      // Process the return
      const result = await SaleService.processSaleReturn(selectedSale.id, returnData, itemsToReturn);
      
      if (result && result.success) {
        toast.success(t('sales:return.success'));
        closeReturnModal();
        
        // Reset return form
        setReturnItems([]);
        setReturnNote('');
        
        // Refresh the sales list
        refresh();
      } else {
        toast.error(t('sales:return.error'));
      }
    } catch (error) {
      console.error('Error processing return:', error);
      toast.error(t('sales:return.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Render the sale item list
  const renderSaleItems = (items) => {
    if (!items || items.length === 0) {
      return <tr><td colSpan="4">No items found</td></tr>;
    }

    return items.map(item => (
      <tr key={item.id}>
        <td>{item.product_name}</td>
        <td>{item.quantity} {item.product && getUnitName(item.product)}</td>
        <td>{formatWithCurrency(item.unit_price)}</td>
        <td>{formatWithCurrency(item.total_price)}</td>
      </tr>
    ));
  };

  // Calculate return total with tax settings applied
  const calculateReturnAmount = (items) => {
    // Calculate total for returned items
    const subtotal = items.reduce((sum, item) => {
      if (item.returnQuantity && item.returnQuantity > 0) {
        return sum + (item.returnQuantity * item.unit_price);
      }
      return sum;
    }, 0);
    
    return {
      subtotal,
      total: subtotal
    };
  };

  // For display in the UI
  const returnAmounts = calculateReturnAmount(returnItems);

  // Print receipt 
  const handlePrintReceipt = () => {
    if (!selectedSale) return;
    
    try {
      // Create receipt data structure for the printer
      const receiptData = {
        id: selectedSale.id,
        receiptNumber: `S-${selectedSale.id}`,
        date: formatDate(selectedSale.date),
        items: selectedSale.items.map(item => ({
          name: item.product_name,
          price: item.unit_price,
          quantity: item.quantity,
          totalPrice: item.total_price,
          product: { unit: item.unit || 'pcs' }
        })),
        subtotal: selectedSale.subtotal,
        discount: selectedSale.discount_amount,
        total: selectedSale.total_amount,
        paymentMethod: selectedSale.payment_method,
        cashAmount: selectedSale.cash_amount,
        cardAmount: selectedSale.card_amount,
        isSplitPayment: selectedSale.payment_method === 'split',
        amountPaid: selectedSale.amount_paid,
        changeAmount: selectedSale.change_amount,
        businessName: getBusinessName(),
        businessAddress: getBusinessAddress(),
        businessPhone: getBusinessPhone(),
        businessEmail: getBusinessEmail(),
        receiptHeader: getReceiptHeader(),
        receiptFooter: getReceiptFooter()
      };
      
      // Print the receipt
      printReceipt(receiptData, t, formatWithCurrency);
      
      toast.success(t('sales:printSuccess'));
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast.error(t('sales:printError'));
    }
  };

  // Get the translated unit name for a product
  const getUnitName = (product) => {
    if (!product || !product.unit) return t('pos:units.default');
    
    // Get the unit key in lowercase
    const unitKey = product.unit.toLowerCase();
    
    // Try direct translation first - this will get abbreviations like "ad", "kg", etc.
    return t(`pos:units.${unitKey}`, { defaultValue: unitKey });
  };

  // Open the cancel confirmation modal
  const openCancelConfirmModal = () => {
    setIsCancelConfirmModalOpen(true);
    document.body.classList.add('modal-open');
  };

  // Close the cancel confirmation modal
  const closeCancelConfirmModal = () => {
    setIsCancelConfirmModalOpen(false);
    document.body.classList.remove('modal-open');
  };

  // Handle sale cancellation
  const handleCancelSale = async () => {
    if (!selectedSale) return;
    
    setIsProcessing(true);
    
    try {
      // Call the API to cancel the sale
      await SaleService.cancelSale(selectedSale.id);
      
      closeCancelConfirmModal();
      refresh();
      handleCloseDetails();
      toast.success(t('sales:cancel.success'));
    } catch (error) {
      console.error('Sale cancellation error:', error);
      toast.error(t('sales:cancel.error'));
    } finally {
      setIsProcessing(false);
    }
  };

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
            <option value="split">{t('sales:paymentMethods.split')}</option>
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
                  <th>{t('sales:table.headers.subtotal')}</th>
                  <th>{t('sales:table.headers.discount')}</th>
                  <th>{t('sales:table.headers.total')}</th>
                  <th>{t('sales:table.headers.payment')}</th>
                  <th>{t('sales:table.headers.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr className="empty-state">
                    <td colSpan="8">
                      <p>{t('sales:table.noRecords')}</p>
                    </td>
                  </tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id} onClick={() => handleSelectSale(sale)} className={sale.is_returned ? 'canceled-sale' : ''}>
                      <td>
                        {sale.receipt_number || '-'}
                        {sale.is_returned && <span className="status-badge canceled">{t('sales:status.canceled')}</span>}
                      </td>
                      <td>{formatDate(sale.created_at)}</td>
                      <td>{sale.total_items || 0}</td>
                      <td>{formatWithCurrency(sale.subtotal || 0)}</td>
                      <td>{sale.discount_amount > 0 ? `-${formatWithCurrency(sale.discount_amount || 0)}` : '-'}</td>
                      <td>{formatWithCurrency(sale.total_amount || 0)}</td>
                      <td>
                        {sale.payment_method === 'split' ? (
                          <div className="payment-method-split">
                            {t(`sales:paymentMethods.${sale.payment_method}`)}
                            <div className="payment-details">
                              {formatWithCurrency(sale.cash_amount || 0)} + {formatWithCurrency(sale.card_amount || 0)}
                            </div>
                          </div>
                        ) : (
                          t(`sales:paymentMethods.${sale.payment_method}`)
                        )}
                      </td>
                      <td>
                        <button 
                          className="action-button view"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSale(sale);
                          }}
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
                <h3>{getBusinessName()}</h3>
                {getBusinessAddress() && <p>{getBusinessAddress()}</p>}
                {getBusinessPhone() && <p>{t('pos:receipt.phone')}: {getBusinessPhone()}</p>}
                {getBusinessEmail() && <p>{t('pos:receipt.email')}: {getBusinessEmail()}</p>}
                <p>{t('sales:receipt.number', { number: selectedSale.receipt_number })}</p>
                <p>{formatDate(selectedSale.created_at)}</p>
                {selectedSale.is_returned && <p className="canceled-status">{t('sales:status.canceled')}</p>}
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
                  <span>{formatWithCurrency(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount_amount > 0 && (
                  <div className="summary-row discount">
                    <span>{t('sales:receipt.discount')}:</span>
                    <span>-{formatWithCurrency(selectedSale.discount_amount)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>{t('sales:receipt.total')}:</span>
                  <span>{formatWithCurrency(selectedSale.total_amount)}</span>
                </div>
                <div className="summary-row">
                  <span>{t('sales:receipt.paymentMethod')}:</span>
                  <span>{t(`sales:paymentMethods.${selectedSale.payment_method}`)}</span>
                </div>

                {selectedSale.payment_method === 'split' ? (
                  <>
                    <div className="summary-row payment-detail">
                      <span>{t('sales:receipt.cashAmount')}:</span>
                      <span>{formatWithCurrency(selectedSale.cash_amount || 0)}</span>
                    </div>
                    <div className="summary-row payment-detail">
                      <span>{t('sales:receipt.cardAmount')}:</span>
                      <span>{formatWithCurrency(selectedSale.card_amount || 0)}</span>
                    </div>
                    {selectedSale.change_amount > 0 && (
                      <div className="summary-row">
                        <span>{t('sales:receipt.change')}:</span>
                        <span>{formatWithCurrency(selectedSale.change_amount)}</span>
                      </div>
                    )}
                  </>
                ) : selectedSale.payment_method === 'cash' && (
                  <>
                    <div className="summary-row">
                      <span>{t('sales:receipt.amountReceived')}:</span>
                      <span>{formatWithCurrency(selectedSale.amount_paid)}</span>
                    </div>
                    <div className="summary-row">
                      <span>{t('sales:receipt.change')}:</span>
                      <span>{formatWithCurrency(selectedSale.change_amount)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="receipt-actions">
                <button 
                  className="button secondary" 
                  onClick={handlePrintReceipt} 
                  disabled={!selectedSale}
                >
                  {t('sales:actions.printReceipt')}
                </button>
                <button 
                  className="button primary" 
                  onClick={openReturnModal} 
                  disabled={!selectedSale || selectedSale.is_returned}
                >
                  {t('sales:actions.processReturn')}
                </button>
                <button 
                  className="button danger" 
                  onClick={openCancelConfirmModal} 
                  disabled={!selectedSale || selectedSale.is_returned}
                >
                  {t('sales:actions.cancelSale')}
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
                  <table className="return-items-table">
                    <thead>
                      <tr>
                        <th>{t('sales:return.product')}</th>
                        <th>{t('sales:return.originalQuantity')}</th>
                        <th>{t('sales:return.price')}</th>
                        <th>{t('sales:return.returnQuantity')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.product_name}</td>
                          <td>{item.quantity} {item.product && getUnitName(item.product)}</td>
                          <td>{formatWithCurrency(item.unit_price || item.price || 0)}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={item.returnQuantity}
                              onChange={(e) => handleReturnQuantityChange(item.id, e.target.value)}
                              className="return-quantity-input"
                            />
                            {item.product && <span style={styles.unitName}>{getUnitName(item.product)}</span>}
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
                    <span>{t('sales:return.subtotal')}:</span>
                    <span>{formatWithCurrency(returnAmounts.subtotal)}</span>
                  </div>
                  <div className="return-total">
                    <span>{t('sales:return.totalRefund')}:</span>
                    <span>{formatWithCurrency(returnAmounts.total)}</span>
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
                  disabled={isProcessing || returnAmounts.total <= 0}
                >
                  {isProcessing ? t('common:processing') : t('sales:return.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Cancel Sale Confirmation Modal */}
      {isCancelConfirmModalOpen && selectedSale && (
        <div className="modal-overlay">
          <div className="modal cancel-modal">
            <div className="modal-header">
              <h3>{t('sales:cancel.title')}</h3>
              <button className="close-button" onClick={closeCancelConfirmModal}>×</button>
            </div>
            
            <div className="modal-body">
              <p className="cancel-warning">
                {t('sales:cancel.warning')}
              </p>
              <p>
                {t('sales:cancel.receiptInfo', { 
                  number: selectedSale.receipt_number, 
                  date: formatDate(selectedSale.created_at) 
                })}
              </p>
              <p className="cancel-detail">
                {t('sales:cancel.detail')}
              </p>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="button secondary" 
                onClick={closeCancelConfirmModal}
                disabled={isProcessing}
              >
                {t('common:cancel')}
              </button>
              <button 
                type="button" 
                className="button danger" 
                onClick={handleCancelSale}
                disabled={isProcessing}
              >
                {isProcessing ? t('common:processing') : t('sales:cancel.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
