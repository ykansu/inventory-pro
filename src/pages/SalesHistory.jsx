import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import useSalesHistory from '../hooks/useSalesHistory';
import { SaleService, SettingService } from '../services/DatabaseService';
import { calculateReturnTotal, formatCurrency } from '../utils/calculations';
import { printReceipt } from '../utils/receiptPrinter';
import { toast } from 'react-hot-toast';
import '../styles/pages/sales-history.css';
import '../styles/components/modal.css';
import { format } from 'date-fns';

const SalesHistory = () => {
  const { t } = useTranslation(['sales', 'common', 'pos']);
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
  // Settings state for currency
  const [currency, setCurrency] = useState('usd');
  // Add more settings
  const [settings, setSettings] = useState({
    businessName: 'Inventory Pro',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    dateFormat: 'mm/dd/yyyy',
    enableTax: true,
    taxRate: 18
  });
  
  // Return modal states
  const [returnItems, setReturnItems] = useState([]);
  const [returnNote, setReturnNote] = useState('');
  const [returnError, setReturnError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const allSettings = await SettingService.getAllSettings();
        if (allSettings) {
          setCurrency(allSettings.currency?.toLowerCase() || 'usd');
          
          setSettings({
            businessName: allSettings.business_name || 'Inventory Pro',
            businessAddress: allSettings.business_address || '',
            businessPhone: allSettings.business_phone || '',
            businessEmail: allSettings.business_email || '',
            dateFormat: allSettings.date_format || 'mm/dd/yyyy',
            enableTax: allSettings.enable_tax !== undefined ? allSettings.enable_tax : true,
            taxRate: parseFloat(allSettings.tax_rate) || 18
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Helper function to format currency consistently
  const formatWithCurrency = (amount) => {
    return formatCurrency(amount, currency);
  };

  // Format dates according to user settings
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    switch (settings.dateFormat) {
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
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out items with return quantity > 0
    const itemsToReturn = returnItems.filter(item => item.returnQuantity > 0);
    
    if (itemsToReturn.length === 0) {
      setReturnError(t('sales:return.errorNoItems'));
      return;
    }
    
    setReturnError('');
    setIsProcessing(true);
    
    try {
      // Calculate the amounts for reference
      const amounts = calculateReturnAmount(returnItems);
      
      // Format return data according to the model expectations
      const returnData = {
        notes: returnNote,
        reason: returnNote,
        subtotal: amounts.subtotal,
        tax_amount: amounts.tax,
        total_amount: amounts.total,
        return_date: new Date().toISOString()
      };
      
      // Format items for the return API
      const formattedItems = itemsToReturn.map(item => ({
        product_id: item.product_id,
        quantity: item.returnQuantity
      }));
      
      // Call the API with the expected parameters
      await SaleService.processSaleReturn(selectedSale.id, returnData, formattedItems);
      
      closeReturnModal();
      refresh();
      toast.success(t('sales:return.success'));
    } catch (error) {
      console.error('Return processing error:', error);
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
        <td>{item.quantity}</td>
        <td>{formatWithCurrency(item.unit_price)}</td>
        <td>{formatWithCurrency(item.total_price)}</td>
      </tr>
    ));
  };

  // Calculate return total with tax settings applied
  const calculateReturnAmount = (items) => {
    // Calculate subtotal
    const subtotal = calculateReturnTotal(items);
    
    // Calculate tax if enabled
    const tax = settings.enableTax ? subtotal * (settings.taxRate / 100) : 0;
    
    // Return total amount
    return {
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  // For display in the UI
  const returnAmounts = calculateReturnAmount(returnItems);

  // Print receipt 
  const handlePrintReceipt = () => {
    if (selectedSale && selectedSaleDetails) {
      // Format receipt data in the structure expected by the receipt printer
      const receiptData = {
        receipt_number: selectedSale.receipt_number,
        businessName: settings.businessName,
        businessAddress: settings.businessAddress,
        businessPhone: settings.businessPhone,
        businessEmail: settings.businessEmail,
        date: formatDate(selectedSale.created_at),
        items: selectedSaleDetails.items.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
          totalPrice: item.total_price
        })),
        subtotal: selectedSale.subtotal,
        discount: selectedSale.discount_amount,
        tax: selectedSale.tax_amount,
        total: selectedSale.total_amount,
        payment_method: selectedSale.payment_method,
        amountPaid: selectedSale.amount_paid,
        changeAmount: selectedSale.change_amount,
        cashAmount: selectedSale.cash_amount,
        cardAmount: selectedSale.card_amount
      };
      
      // Use the receipt printer utility
      printReceipt(receiptData, t, formatWithCurrency);
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
                    <tr key={sale.id} onClick={() => handleSelectSale(sale)}>
                      <td>{sale.receipt_number || '-'}</td>
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
                <h3>{settings.businessName}</h3>
                {settings.businessAddress && <p>{settings.businessAddress}</p>}
                {settings.businessPhone && <p>{t('pos:receipt.phone')}: {settings.businessPhone}</p>}
                {settings.businessEmail && <p>{t('pos:receipt.email')}: {settings.businessEmail}</p>}
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
                  <span>{formatWithCurrency(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount_amount > 0 && (
                  <div className="summary-row discount">
                    <span>{t('sales:receipt.discount')}:</span>
                    <span>-{formatWithCurrency(selectedSale.discount_amount)}</span>
                  </div>
                )}
                {settings.enableTax && selectedSale.tax_amount > 0 && (
                  <div className="summary-row">
                    <span>{t('sales:receipt.tax')}:</span>
                    <span>{formatWithCurrency(selectedSale.tax_amount)}</span>
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
                          <td>{item.quantity}</td>
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
                  {settings.enableTax && returnAmounts.tax > 0 && (
                    <div className="return-total">
                      <span>{t('sales:return.tax', { rate: settings.taxRate })}:</span>
                      <span>{formatWithCurrency(returnAmounts.tax)}</span>
                    </div>
                  )}
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
    </div>
  );
};

export default SalesHistory;
