import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import useSalesHistory from '../hooks/useSalesHistory';
import { SaleService, ProductService } from '../services/DatabaseService';
import { calculateReturnTotal, formatCurrency } from '../utils/calculations';
import { printReceipt } from '../utils/receiptPrinter';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useDatabase } from '../context/DatabaseContext';
import { useSettings } from '../context/SettingsContext';

// Import CSS module
import styles from './SalesHistory.module.css';

// Import common components
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import FormGroup from '../components/common/FormGroup';
import Pagination from '../components/common/Pagination';

// Inline styles for unit display
const unitNameStyle = {
  fontSize: '0.75rem',
  color: '#4b5563',
  marginLeft: '0.25rem',
  whiteSpace: 'nowrap'
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
    refresh,
    pagination
  } = useSalesHistory(1, 10); // Initial page 1, 10 items per page
  
  const { currentPage, pageSize, totalCount, totalPages, handlePageChange } = pagination;
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

  // Handle filter application for date range only
  const handleApplyDateFilters = () => {
    updateFilters({
      start: tempDateRange.start,
      end: tempDateRange.end
    });
  };

  // Handlers for immediate filter application
  const handlePaymentFilterChange = (e) => {
    const value = e.target.value;
    setTempPaymentFilter(value);
    updateFilters({ payment: value });
  };

  const handleSearchQueryChange = (e) => {
    const value = e.target.value;
    setTempSearchQuery(value);
    updateFilters({ query: value });
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
  };

  // Close the return modal
  const closeReturnModal = () => {
    setIsReturnModalOpen(false);
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
      toast.error(t('sales:return.errorNoItems'));
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
    } catch (err) {
      console.error('Error processing return:', err);
      setReturnError(t('sales:return.errorProcessing'));
      toast.error(t('sales:return.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to render sale items
  const renderSaleItems = (items) => {
    return items.map((item, index) => (
      <tr key={item.id || index}>
        <td>{item.product_name || item.name}</td>
        <td>
          {item.quantity}
          <span style={unitNameStyle}>
            {item.product?.unit || 'units'}
          </span>
        </td>
        <td>{formatWithCurrency(item.unit_price)}</td>
        <td>{formatWithCurrency(item.total_price)}</td>
      </tr>
    ));
  };

  // Helper function to calculate return amounts
  const calculateReturnAmount = (items) => {
    const returnItems = items.filter(item => item.returnQuantity > 0);
    
    if (returnItems.length === 0) {
      return { subtotal: 0, total: 0 };
    }
    
    const subtotal = returnItems.reduce(
      (sum, item) => sum + (item.unit_price * item.returnQuantity), 
      0
    );
    
    // Calculate total (applying discounts or taxes if needed)
    return calculateReturnTotal(returnItems, selectedSale);
  };

  // Helper function to print receipt
  const handlePrintReceipt = () => {
    if (!selectedSale) return;
    
    try {
      const receiptData = {
        business: {
          name: getBusinessName(),
          address: getBusinessAddress(),
          phone: getBusinessPhone(),
          email: getBusinessEmail()
        },
        receiptHeader: getReceiptHeader(),
        receiptFooter: getReceiptFooter(),
        sale: {
          ...selectedSale,
          formattedDate: formatDate(selectedSale.created_at || selectedSale.date)
        },
        formatCurrency: formatWithCurrency,
        t
      };
      
      printReceipt(receiptData);
    } catch (err) {
      console.error('Error printing receipt:', err);
      toast.error(t('pos:receipt.printError'));
    }
  };

  // Helper function to get unit name
  const getUnitName = (product) => {
    if (!product) return 'units';
    
    if (typeof product === 'object' && product.unit) {
      return product.unit;
    }
    
    return 'units';
  };

  // Modal control functions
  const openCancelConfirmModal = () => {
    setIsCancelConfirmModalOpen(true);
  };

  // Close the cancel confirmation modal
  const closeCancelConfirmModal = () => {
    setIsCancelConfirmModalOpen(false);
  };

  // Handle sale cancellation
  const handleCancelSale = async () => {
    if (!selectedSale) return;
    
    try {
      const result = await SaleService.cancelSale(selectedSale.id);
      
      if (result && result.success) {
        toast.success(t('sales:cancel.success'));
        closeCancelConfirmModal();
        
        // Refresh the sales list and update the selected sale
        refresh();
        
        // Update the selected sale to show it's canceled
        if (selectedSale) {
          const updatedSale = await SaleService.getSaleById(selectedSale.id);
          setSelectedSale(updatedSale);
          setSelectedSaleDetails(updatedSale);
        }
      } else {
        toast.error(t('sales:cancel.error'));
      }
    } catch (err) {
      console.error('Error canceling sale:', err);
      toast.error(t('sales:cancel.error'));
    }
  };

  // Define table columns for the sales table
  const columns = [
    {
      key: 'id',
      title: t('sales:table.headers.receipt'),
      render: (sale) => (
        <span className={sale.is_returned ? styles.canceledSale : ''}>
          #{sale.receipt_number || sale.id}
        </span>
      )
    },
    {
      key: 'date',
      title: t('sales:table.headers.dateTime'),
      render: (sale) => (
        <span className={sale.is_returned ? styles.canceledSale : ''}>
          {formatDate(sale.created_at || sale.date)}
        </span>
      )
    },
    {
      key: 'items',
      title: t('sales:table.headers.items'),
      render: (sale) => (
        <span className={sale.is_returned ? styles.canceledSale : ''}>
          {sale.item_count || 0}
        </span>
      )
    },
    {
      key: 'total_amount',
      title: t('sales:table.headers.total'),
      render: (sale) => (
        <span className={sale.is_returned ? styles.canceledSale : ''}>
          {formatWithCurrency(sale.total_amount)}
        </span>
      )
    },
    {
      key: 'payment_method',
      title: t('sales:table.headers.payment'),
      render: (sale) => (
        <span className={sale.is_returned ? styles.canceledSale : ''}>
          {sale.payment_method === 'split' 
            ? t('sales:paymentMethods.split') 
            : t(`sales:paymentMethods.${sale.payment_method}`)}
        </span>
      )
    },
    {
      key: 'status',
      title: t('common:status'),
      render: (sale) => (
        sale.is_returned ? (
          <span className={`${styles.statusBadge} ${styles.canceled}`}>
            {t('sales:status.canceled')}
          </span>
        ) : (
          <span className={styles.statusBadge}>
            {t('sales:status.completed')}
          </span>
        )
      )
    },
    {
      key: 'actions',
      title: t('sales:table.headers.actions'),
      render: (sale) => (
        <Button 
          variant="secondary" 
          size="small" 
          onClick={() => handleSelectSale(sale)}
        >
          {t('sales:actions.viewDetails')}
        </Button>
      )
    }
  ];

  // Return the component JSX
  return (
    <div className={styles.salesHistoryPage}>
      <div className={styles.pageHeader}>
        <h1>{t('sales:title')}</h1>
        <Button 
          variant="primary"
          onClick={refresh}
          disabled={loading}
        >
          {t('common:refresh')}
        </Button>
      </div>

      <div className={styles.salesFilters}>
        <div className={styles.salesDateFilters}>
          <FormGroup 
            label={t('sales:filters.from')} 
            htmlFor="start-date"
          >
            <input
              id="start-date"
              type="date"
              className={styles.dateInput}
              value={tempDateRange.start}
              onChange={(e) => setTempDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </FormGroup>

          <FormGroup 
            label={t('sales:filters.to')} 
            htmlFor="end-date"
          >
            <input
              id="end-date"
              type="date"
              className={styles.dateInput}
              value={tempDateRange.end}
              onChange={(e) => setTempDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </FormGroup>

          <Button
            variant="primary"
            onClick={handleApplyDateFilters}
            disabled={loading}
          >
            {t('sales:filters.apply')}
          </Button>
        </div>

        <div className={styles.additionalFilters}>
          <FormGroup 
            label={t('sales:table.headers.payment')} 
            htmlFor="payment-filter"
          >
            <select
              id="payment-filter"
              className={styles.filterSelect}
              value={tempPaymentFilter}
              onChange={handlePaymentFilterChange}
            >
              <option value="">{t('sales:filters.allPaymentMethods')}</option>
              <option value="cash">{t('sales:paymentMethods.cash')}</option>
              <option value="card">{t('sales:paymentMethods.card')}</option>
              <option value="split">{t('sales:paymentMethods.split')}</option>
            </select>
          </FormGroup>

          <FormGroup 
            label={t('common:search')} 
            htmlFor="search-query"
          >
            <input
              id="search-query"
              type="text"
              className={styles.searchInput}
              value={tempSearchQuery}
              onChange={handleSearchQueryChange}
              placeholder={t('sales:filters.searchPlaceholder')}
            />
          </FormGroup>
        </div>
      </div>

      <div className={styles.salesContainer}>
        <div className={styles.salesList}>
          {loading ? (
            <div className={styles.loadingState}>
              {t('sales:loading')}
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              {t('sales:error')}
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={sales.map(sale => ({
                  ...sale,
                  className: selectedSale && selectedSale.id === sale.id ? styles.selectedRow : '',
                  onClick: () => handleSelectSale(sale)
                }))}
                emptyMessage={t('sales:table.noRecords')}
              />
              
              {/* Pagination */}
              {totalCount > 0 && (
                <div className={styles.pagination}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {selectedSale && (
          <div className={styles.saleDetails}>
            <div className={styles.saleDetailsHeader}>
              <h3>{t('sales:details.title')}</h3>
              <Button 
                variant="secondary" 
                size="small" 
                onClick={handleCloseDetails}
              >
                {t('common:close')}
              </Button>
            </div>

            <div className={styles.receipt}>
              <div className={styles.receiptHeader}>
                <h4>{getBusinessName()}</h4>
                {getBusinessAddress() && <p>{getBusinessAddress()}</p>}
                {getBusinessPhone() && <p>{t('common:phone')}: {getBusinessPhone()}</p>}
                {getBusinessEmail() && <p>{t('common:email')}: {getBusinessEmail()}</p>}
                <p>{t('common:date')}: {formatDate(selectedSale.created_at || selectedSale.date)}</p>
                <p>{t('sales:receipt.number', { number: selectedSale.receipt_number || selectedSale.id })}</p>
                {selectedSale.is_returned && (
                  <div className={styles.canceledStatus}>{t('sales:status.canceled')}</div>
                )}
              </div>

              <div className={styles.receiptItems}>
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
                    {selectedSale.items && renderSaleItems(selectedSale.items)}
                  </tbody>
                </table>
              </div>

              <div className={styles.receiptSummary}>
                <div className={styles.summaryRow}>
                  <span>{t('sales:receipt.subtotal')}:</span>
                  <span>{formatWithCurrency(selectedSale.subtotal)}</span>
                </div>

                {(selectedSale.discount > 0 || selectedSale.discount_amount > 0) && (
                  <div className={`${styles.summaryRow} ${styles.discount}`}>
                    <span>{t('sales:receipt.discount')}:</span>
                    <span>-{formatWithCurrency(selectedSale.discount || selectedSale.discount_amount || 0)}</span>
                  </div>
                )}

                {selectedSale.tax_amount > 0 && (
                  <div className={styles.summaryRow}>
                    <span>{t('sales:receipt.tax')}:</span>
                    <span>{formatWithCurrency(selectedSale.tax_amount)}</span>
                  </div>
                )}

                <div className={`${styles.summaryRow} ${styles.total}`}>
                  <span>{t('sales:receipt.total')}:</span>
                  <span>{formatWithCurrency(selectedSale.total_amount)}</span>
                </div>

                {/* Payment Method */}
                <div className={styles.summaryRow}>
                  <span>{t('sales:receipt.paymentMethod')}:</span>
                  <span>
                    {selectedSale.payment_method === 'split' 
                      ? t('sales:paymentMethods.split') 
                      : t(`sales:paymentMethods.${selectedSale.payment_method}`)}
                  </span>
                </div>

                {selectedSale.payment_method === 'split' && selectedSale.payment_details && (
                  <div className={styles.paymentMethodSplit}>
                    <div>{t('common:paymentDetails')}:</div>
                    <div className={styles.paymentDetails}>
                      {selectedSale.payment_details.map((payment, idx) => (
                        <div className={styles.summaryRow} key={idx}>
                          <span>{t(`sales:paymentMethods.${payment.method}`)}:</span>
                          <span>{formatWithCurrency(payment.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cash and card amount for split payments from older format */}
                {selectedSale.payment_method === 'split' && !selectedSale.payment_details && (
                  <div className={styles.paymentMethodSplit}>
                    <div>{t('common:paymentDetails')}:</div>
                    <div className={styles.paymentDetails}>
                      {selectedSale.cash_amount > 0 && (
                        <div className={styles.summaryRow}>
                          <span>{t('sales:paymentMethods.cash')}:</span>
                          <span>{formatWithCurrency(selectedSale.cash_amount)}</span>
                        </div>
                      )}
                      {selectedSale.card_amount > 0 && (
                        <div className={styles.summaryRow}>
                          <span>{t('sales:paymentMethods.card')}:</span>
                          <span>{formatWithCurrency(selectedSale.card_amount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Change amount if applicable */}
                {selectedSale.change_amount > 0 && (
                  <div className={styles.summaryRow}>
                    <span>{t('sales:receipt.change')}:</span>
                    <span>{formatWithCurrency(selectedSale.change_amount)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.receiptActions}>
              <Button 
                variant="primary" 
                onClick={handlePrintReceipt}
              >
                {t('sales:actions.printReceipt')}
              </Button>
              
              {!selectedSale.is_returned && (
                <>
                  <Button 
                    variant="secondary" 
                    onClick={openReturnModal}
                  >
                    {t('sales:actions.processReturn')}
                  </Button>
                  
                  <Button 
                    variant="danger" 
                    onClick={openCancelConfirmModal}
                  >
                    {t('sales:actions.cancelSale')}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={closeReturnModal}
        title={t('sales:return.title')}
        size="large"
      >
        <form onSubmit={handleReturnSubmit}>
          <div className={styles.returnItems}>
            <h4>{t('sales:return.selectItems', { defaultValue: "Select Items to Return" })}</h4>
            <table>
              <thead>
                <tr>
                  <th>{t('sales:return.product')}</th>
                  <th>{t('sales:return.originalQuantity')}</th>
                  <th>{t('sales:return.returnQuantity')}</th>
                  <th>{t('sales:return.price')}</th>
                  <th>{t('sales:return.returnAmount', { defaultValue: "Return Amount" })}</th>
                </tr>
              </thead>
              <tbody>
                {returnItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.product_name || item.name}</td>
                    <td>
                      {item.quantity} 
                      <span style={unitNameStyle}>
                        {getUnitName(item.product)}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={item.returnQuantity || 0}
                        onChange={(e) => handleReturnQuantityChange(item.id, e.target.value)}
                      />
                    </td>
                    <td>{formatWithCurrency(item.unit_price)}</td>
                    <td>{formatWithCurrency(item.unit_price * (item.returnQuantity || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.returnNote}>
            <FormGroup 
              label={t('sales:return.note')} 
              htmlFor="return-note"
            >
              <textarea
                id="return-note"
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                placeholder={t('sales:return.notePlaceholder')}
              />
            </FormGroup>
          </div>

          <div className={styles.returnSummary}>
            <div className={styles.returnTotal}>
              <span>{t('sales:return.totalRefund')}</span>
              <span>{formatWithCurrency(calculateReturnAmount(returnItems).total)}</span>
            </div>
            <div className={styles.returnInfo}>
              {t('sales:return.info', { defaultValue: "Returns will be processed immediately and inventory will be updated." })}
            </div>
          </div>

          {returnError && <div className={styles.errorMessage}>{returnError}</div>}

          <div className={styles.receiptActions}>
            <Button
              type="submit"
              variant="primary"
              disabled={isProcessing}
            >
              {isProcessing ? t('common:processing') : t('sales:return.confirm')}
            </Button>
            <Button
              variant="secondary"
              onClick={closeReturnModal}
              disabled={isProcessing}
            >
              {t('common:cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelConfirmModalOpen}
        onClose={closeCancelConfirmModal}
        title={t('sales:cancel.title')}
      >
        <div className={styles.cancelWarning}>
          <p>{t('sales:cancel.warning')}</p>
        </div>
        <div className={styles.cancelDetail}>
          <p>{t('sales:cancel.detail')}</p>
        </div>
        <div className={styles.receiptActions}>
          <Button
            variant="danger"
            onClick={handleCancelSale}
          >
            {t('sales:cancel.confirm')}
          </Button>
          <Button
            variant="secondary"
            onClick={closeCancelConfirmModal}
          >
            {t('common:cancel')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SalesHistory;
