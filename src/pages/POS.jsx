import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ProductService, CategoryService, SaleService, SettingService } from '../services/DatabaseService';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/calculations';

const POS = () => {
  const { t } = useTranslation(['pos', 'common']);
  
  // State for products, categories, cart, and search
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [settings, setSettings] = useState({
    businessName: 'Inventory Pro',
    taxRate: 18,
    currency: 'TRY'
  });
  
  // State for totals calculation
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  
  // State for payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  
  // State for receipt modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  
  // Refs
  const searchInputRef = useRef(null);
  const receiptRef = useRef(null);
  
  // Focus on search input when component mounts
  useEffect(() => {
    searchInputRef.current.focus();
    
    // Load products, categories, and settings
    const loadData = async () => {
      try {
        const allProducts = await ProductService.getAllProducts();
        setProducts(allProducts);
        setFilteredProducts(allProducts);
        
        const allCategories = await CategoryService.getAllCategories();
        setCategories(allCategories);
        
        const allSettings = await SettingService.getAllSettings();
        if (allSettings) {
          setSettings({
            businessName: allSettings.business_name || 'Inventory Pro',
            taxRate: parseFloat(allSettings.tax_rate) || 18,
            currency: allSettings.currency || 'TRY'
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Calculate totals whenever cart items change
  useEffect(() => {
    const newSubtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const newTax = newSubtotal * (settings.taxRate / 100);
    const newTotal = newSubtotal + newTax;
    
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newTotal);
  }, [cartItems, settings.taxRate]);
  
  // Filter products based on search query and selected category
  useEffect(() => {
    let filtered = products;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchQuery))
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);
  
  // Handle product search
  const handleSearch = async (event) => {
    event.preventDefault();
    
    // If the search query looks like a barcode (numeric only), try to find by barcode first
    if (/^\d+$/.test(searchQuery)) {
      try {
        const product = await ProductService.getProductByBarcode(searchQuery);
        if (product) {
          addToCart(product);
          setSearchQuery('');
          return;
        }
      } catch (error) {
        console.error('Error searching by barcode:', error);
      }
    }
    
    // If no product found by barcode, use the filtered products
    if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0]);
      setSearchQuery('');
    }
  };
  
  // Handle barcode scan
  const handleBarcodeInput = async (event) => {
    const barcode = event.target.value;
    setSearchQuery(barcode);
    
    // If input ends with a return character (scanner usually adds this)
    if (barcode.endsWith('\n') || barcode.endsWith('\r')) {
      const cleanBarcode = barcode.replace(/[\r\n]/g, '');
      setSearchQuery(cleanBarcode);
      
      try {
        const product = await ProductService.getProductByBarcode(cleanBarcode);
        if (product) {
          addToCart(product);
          setSearchQuery('');
        }
      } catch (error) {
        console.error('Error processing barcode:', error);
      }
    }
  };
  
  // Add product to cart
  const addToCart = (product) => {
    // Check if product is already in cart
    const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
    
    // Check if there's enough stock
    if (product.stock_quantity <= 0) {
      alert(t('pos:cart.outOfStock'));
      return;
    }
    
    if (existingItemIndex > -1) {
      // If product is already in cart, update quantity
      const updatedCart = [...cartItems];
      const item = updatedCart[existingItemIndex];
      
      // Ensure we don't exceed available stock
      if (item.quantity + 1 > product.stock_quantity) {
        alert(t('pos:cart.insufficientStock'));
        return;
      }
      
      item.quantity += 1;
      item.totalPrice = item.quantity * item.price;
      setCartItems(updatedCart);
    } else {
      // Add new item to cart
      const newItem = {
        id: product.id,
        name: product.name,
        price: product.selling_price,
        quantity: 1,
        totalPrice: product.selling_price,
        product: product
      };
      setCartItems([...cartItems, newItem]);
    }
  };
  
  // Update item quantity in cart
  const updateCartItemQuantity = (itemId, newQuantity) => {
    const updatedCart = cartItems.map(item => {
      if (item.id === itemId) {
        // Ensure we don't go below 1 or exceed available stock
        const quantity = Math.max(1, Math.min(newQuantity, item.product.stock_quantity));
        return {
          ...item,
          quantity,
          totalPrice: quantity * item.price
        };
      }
      return item;
    });
    setCartItems(updatedCart);
  };
  
  // Remove item from cart
  const removeCartItem = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };
  
  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };
  
  // Process payment
  const processPayment = async () => {
    if (cartItems.length === 0) {
      alert(t('pos:payment.emptyCart'));
      return;
    }
    
    if (paymentMethod === 'cash' && (parseFloat(amountReceived) || 0) < total) {
      alert(t('pos:payment.insufficientAmount'));
      return;
    }
    
    // Generate receipt number (timestamp-based)
    const receiptNumber = `INV-${format(new Date(), 'yyyyMMdd-HHmmss')}`;
    
    // Prepare sale data
    const saleData = {
      receipt_number: receiptNumber,
      subtotal: subtotal,
      tax_amount: tax,
      total_amount: total,
      payment_method: paymentMethod,
      amount_paid: parseFloat(amountReceived) || total,
      change_amount: parseFloat(change) || 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Prepare sale items
    const saleItems = cartItems.map(item => ({
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      discount_amount: 0, // Discount functionality could be added later
      total_price: item.totalPrice
    }));

    try {
      // Create the sale
      const saleResult = await SaleService.createSale(saleData, saleItems);
      
      // Show success toast notification
      toast.success(
        t('pos:notifications.saleCompleted', { amount: formatCurrency(total) }), 
        { 
          duration: 3000,
          icon: '💰'
        }
      );
      
      // Set receipt data for display
      setCurrentReceipt({
        ...saleResult,
        items: saleItems,
        businessName: settings.businessName,
        receiptNumber: receiptNumber,
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        subtotal: subtotal,
        tax: tax,
        total: total,
        paymentMethod: paymentMethod,
        amountPaid: parseFloat(amountReceived) || total,
        changeAmount: parseFloat(change) || 0
      });
      
      // Close payment modal and show receipt
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      
      // Reset cart and payment state
      setCartItems([]);
      setAmountReceived('');
      setChange(0);
      setPaymentMethod('cash');
      searchInputRef.current.focus();
    } catch (error) {
      console.error('Error processing payment:', error);
      
      // Show error toast notification
      toast.error(
        t('pos:payment.error'), 
        {
          duration: 4000
        }
      );
      
      alert(t('pos:payment.error'));
    }
  };
  
  // Calculate change
  const calculateChange = (value) => {
    const amount = parseFloat(value) || 0;
    setAmountReceived(value);
    setChange(Math.max(0, amount - total));
  };
  
  // Print receipt
  const printReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: monospace; width: 300px; margin: 0 auto; }
              .receipt { padding: 10px; }
              .receipt-header { text-align: center; margin-bottom: 10px; }
              .receipt-items { width: 100%; border-collapse: collapse; margin: 10px 0; }
              .receipt-items th, .receipt-items td { text-align: left; padding: 3px; }
              .summary-row { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; }
              .thank-you { text-align: center; margin-top: 20px; }
            </style>
          </head>
          <body>
            ${receiptRef.current.innerHTML}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };
  
  return (
    <div className="pos-page">
      <div className="pos-container">
        <div className="pos-left-panel">
          <div className="product-search">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                ref={searchInputRef}
                placeholder={t('pos:search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleBarcodeInput}
                className="search-input"
              />
              <button type="submit" className="search-button">{t('pos:search.button')}</button>
            </form>
          </div>

          <div className="product-categories">
            <button 
              className={`category-button ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              {t('pos:categories.all')}
            </button>
            {categories.map(category => (
              <button 
                key={category.id}
                className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="product-grid">
            {filteredProducts.length === 0 ? (
              <div className="product-grid-empty">
                <p>{t('pos:productGrid.empty')}</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <div 
                  key={product.id}
                  className={`product-card ${product.stock_quantity <= 0 ? 'out-of-stock' : ''}`}
                  onClick={() => product.stock_quantity > 0 && addToCart(product)}
                >
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">{formatCurrency(product.selling_price)}</div>
                  <div className="product-stock">
                    {product.stock_quantity <= 0 
                      ? t('pos:productGrid.outOfStock') 
                      : t('pos:productGrid.inStock', { count: product.stock_quantity })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pos-right-panel">
          <div className="cart-header">
            <h3>{t('pos:cart.title')}</h3>
            <button className="clear-cart-button" onClick={clearCart}>{t('pos:cart.clear')}</button>
          </div>

          <div className="cart-items">
            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <p>{t('pos:cart.empty')}</p>
                <p>{t('pos:cart.addInstructions')}</p>
              </div>
            ) : (
              <div className="cart-item-list">
                {cartItems.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-details">
                      <div className="item-name">{item.name}</div>
                      <div className="item-price">{formatCurrency(item.price)} × 
                        <input
                          type="number"
                          min="1"
                          max={item.product.stock_quantity}
                          value={item.quantity}
                          onChange={(e) => updateCartItemQuantity(item.id, parseInt(e.target.value))}
                          className="quantity-input"
                        />
                      </div>
                    </div>
                    <div className="item-actions">
                      <span className="item-total">{formatCurrency(item.totalPrice)}</span>
                      <button 
                        className="remove-item-button"
                        onClick={() => removeCartItem(item.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>{t('pos:summary.subtotal')}:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>{t('pos:summary.tax', { rate: `${settings.taxRate}%` })}:</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="summary-row total">
              <span>{t('pos:summary.total')}:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="payment-actions">
            <button 
              className="payment-button cash"
              onClick={() => {
                setPaymentMethod('cash');
                setShowPaymentModal(true);
              }}
              disabled={cartItems.length === 0}
            >
              {t('pos:payment.cash')}
            </button>
            <button 
              className="payment-button card"
              onClick={() => {
                setPaymentMethod('card');
                setShowPaymentModal(true);
              }}
              disabled={cartItems.length === 0}
            >
              {t('pos:payment.card')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal payment-modal">
            <div className="modal-header">
              <h3>{t(`pos:payment.${paymentMethod}Title`)}</h3>
              <button className="close-button" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="payment-details">
                <div className="payment-summary">
                  <div className="summary-row">
                    <span>{t('pos:summary.total')}:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
                
                {paymentMethod === 'cash' && (
                  <div className="cash-payment-form">
                    <div className="form-group">
                      <label>{t('pos:payment.amountReceived')}:</label>
                      <input
                        type="number"
                        step="0.01"
                        min={total}
                        value={amountReceived}
                        onChange={(e) => calculateChange(e.target.value)}
                        className="amount-input"
                        autoFocus
                      />
                    </div>
                    <div className="change-amount">
                      <span>{t('pos:payment.change')}:</span>
                      <span>{formatCurrency(change)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="button secondary"
                onClick={() => setShowPaymentModal(false)}
              >
                {t('common:cancel')}
              </button>
              <button 
                className="button primary"
                onClick={processPayment}
                disabled={paymentMethod === 'cash' && (parseFloat(amountReceived) || 0) < total}
              >
                {t('pos:payment.complete')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Receipt Modal */}
      {showReceiptModal && currentReceipt && (
        <div className="modal-overlay">
          <div className="modal receipt-modal">
            <div className="modal-header">
              <h3>{t('pos:receipt.title')}</h3>
              <button className="close-button" onClick={() => setShowReceiptModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="receipt" ref={receiptRef}>
                <div className="receipt-header">
                  <h4>{currentReceipt.businessName}</h4>
                  <p>{t('pos:receipt.number', { number: currentReceipt.receiptNumber })}</p>
                  <p>{currentReceipt.date}</p>
                </div>
                <div className="receipt-items">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('pos:receipt.item')}</th>
                        <th>{t('pos:receipt.quantity')}</th>
                        <th>{t('pos:receipt.price')}</th>
                        <th>{t('pos:receipt.total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReceipt.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.product_name}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.unit_price)}</td>
                          <td>{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="receipt-summary">
                  <div className="summary-row">
                    <span>{t('pos:summary.subtotal')}:</span>
                    <span>{formatCurrency(currentReceipt.subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>{t('pos:summary.tax', { rate: `${settings.taxRate}%` })}:</span>
                    <span>{formatCurrency(currentReceipt.tax)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>{t('pos:summary.total')}:</span>
                    <span>{formatCurrency(currentReceipt.total)}</span>
                  </div>
                  <div className="summary-row">
                    <span>{t('pos:receipt.paymentMethod')}:</span>
                    <span>{t(`pos:paymentMethods.${currentReceipt.paymentMethod}`)}</span>
                  </div>
                  {currentReceipt.paymentMethod === 'cash' && (
                    <>
                      <div className="summary-row">
                        <span>{t('pos:receipt.amountReceived')}:</span>
                        <span>{formatCurrency(currentReceipt.amountPaid)}</span>
                      </div>
                      <div className="summary-row">
                        <span>{t('pos:receipt.change')}:</span>
                        <span>{formatCurrency(currentReceipt.changeAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="thank-you">
                  <p>{t('pos:receipt.thankYou')}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="button secondary"
                onClick={() => setShowReceiptModal(false)}
              >
                {t('pos:receipt.close')}
              </button>
              <button 
                className="button primary"
                onClick={printReceipt}
              >
                {t('pos:receipt.print')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
