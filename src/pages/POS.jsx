import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ProductService, CategoryService, SaleService, SettingService } from '../services/DatabaseService';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/calculations';
import { printReceipt } from '../utils/receiptPrinter';

const POS = () => {
  const { t } = useTranslation(['pos', 'common', 'products']);
  
  // State for products, categories, cart, and search
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [settings, setSettings] = useState({
    taxRate: 18,
    enableTax: true,
    currency: 'usd',
    businessName: 'Inventory Pro',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    receiptHeader: '',
    receiptFooter: '',
    dateFormat: 'mm/dd/yyyy',
    enableNotifications: true
  });
  
  // State for totals calculation
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [discount, setDiscount] = useState(0); // Discount amount
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed' or 'total'
  const [discountValue, setDiscountValue] = useState(''); // User input value
  
  // State for payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  
  // State for split payment
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [splitChange, setSplitChange] = useState(0);
  
  // State for receipt modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReceipt, setIsReceipt] = useState(false);
  
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
            businessAddress: allSettings.business_address || '',
            businessPhone: allSettings.business_phone || '',
            businessEmail: allSettings.business_email || '',
            taxRate: parseFloat(allSettings.tax_rate) || 18,
            enableTax: allSettings.enable_tax === true,
            currency: allSettings.currency?.toLowerCase() || 'usd',
            dateFormat: allSettings.date_format || 'mm/dd/yyyy',
            receiptHeader: allSettings.receipt_header || '',
            receiptFooter: allSettings.receipt_footer || 'Thank you for your purchase!',
            enableNotifications: allSettings.enable_notifications === true
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Calculate totals whenever cart items or discount change
  useEffect(() => {
    const newSubtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Apply discount to subtotal
    const discountedSubtotal = Math.max(0, newSubtotal - discount);
    
    // Only calculate tax if tax calculation is enabled and tax rate is greater than 0
    const newTax = settings.enableTax && settings.taxRate > 0 ? discountedSubtotal * (settings.taxRate / 100) : 0;
    const newTotal = discountedSubtotal + newTax;
    
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newTotal);
  }, [cartItems, settings.taxRate, settings.enableTax, discount]);
  
  // Update discount when discount value or type changes
  useEffect(() => {
    applyDiscount();
  }, [discountValue, discountType]);
  
  // Filter products based on search query and selected category
  useEffect(() => {
    let filtered = products;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product => {
        // Turkish search comparison function that handles all character variations
        const makeTurkishSearchable = (str) => {
          if (!str) return '';
          return str
            .toLowerCase()
            // Standardize Turkish characters to Latin equivalents
            .replace(/ı/g, 'i')
            .replace(/i̇/g, 'i')
            .replace(/İ/g, 'i')
            .replace(/I/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/Ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/Ü/g, 'u')
            .replace(/ö/g, 'o')
            .replace(/Ö/g, 'o')
            .replace(/ş/g, 's')
            .replace(/Ş/g, 's')
            .replace(/ç/g, 'c')
            .replace(/Ç/g, 'c');
        };
        
        // Convert both product name and search query to searchable format
        const searchableProductName = makeTurkishSearchable(product.name);
        const searchableQuery = makeTurkishSearchable(searchQuery);
        
        // Check if the searchable product name contains the searchable query
        const nameMatch = searchableProductName.includes(searchableQuery);
        
        // For barcode, just do a simple case-insensitive search (it's usually numeric)
        const barcodeMatch = product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase());
        
        // For price matching, check if the selling price as a string includes the search query
        const priceMatch = product.selling_price.toString().includes(searchQuery);
        
        return nameMatch || barcodeMatch || priceMatch;
      });
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
    clearDiscount(); // Clear discount when cart is cleared
  };
  
  // Apply discount to the subtotal
  const applyDiscount = () => {
    if (!discountValue || isNaN(parseFloat(discountValue)) || parseFloat(discountValue) < 0) {
      setDiscount(0);
      setDiscountValue('');
      return;
    }

    const value = parseFloat(discountValue);
    
    if (discountType === 'percentage') {
      // Ensure percentage is between 0 and 100
      if (value > 100) {
        setDiscountValue('100');
        setDiscount(subtotal);
      } else {
        setDiscount((subtotal * value) / 100);
      }
    } else if (discountType === 'total') {
      // Calculate discount based on desired total
      // Ensure desired total doesn't exceed subtotal
      if (value > subtotal) {
        // If desired total is higher than subtotal, no discount
        setDiscount(0);
      } else {
        // Calculate the discount as the difference between subtotal and desired total
        setDiscount(subtotal - value);
      }
    } else { // fixed amount
      // Ensure fixed discount doesn't exceed subtotal
      if (value > subtotal) {
        setDiscountValue(subtotal.toFixed(2));
        setDiscount(subtotal);
      } else {
        setDiscount(value);
      }
    }
  };

  // Clear the discount
  const clearDiscount = () => {
    setDiscount(0);
    setDiscountValue('');
  };
  
  // Calculate split payment change
  const calculateSplitPayment = (cash) => {
    const cashValue = parseFloat(cash) || 0;
    setCashAmount(cash);
    
    // Calculate how much should be paid by card after cash payment
    const remainingAmount = Math.max(0, total - cashValue);
    setCardAmount(remainingAmount.toFixed(2));
    
    // If cash exceeds total, calculate change
    setSplitChange(Math.max(0, cashValue - total));
  };
  
  // Process payment
  const processPayment = async () => {
    if (cartItems.length === 0) {
      alert(t('pos:payment.emptyCart'));
      return;
    }
    
    // Validation for different payment methods
    if (paymentMethod === 'cash' && (parseFloat(amountReceived) || 0) < total) {
      alert(t('pos:payment.insufficientAmount'));
      return;
    }
    
    if (paymentMethod === 'split') {
      const totalPayment = (parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0);
      if (totalPayment < total) {
        alert(t('pos:payment.insufficientSplitAmount'));
        return;
      }
    }
    
    try {
      setIsProcessing(true);
      
      // Call the completeSale function with the appropriate parameters
      if (paymentMethod === 'split') {
        await completeSale(
          'split',
          (parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0),
          parseFloat(splitChange) || 0,
          parseFloat(cashAmount) || 0,
          parseFloat(cardAmount) || 0
        );
      } else {
        await completeSale(
          paymentMethod,
          parseFloat(amountReceived) || total,
          parseFloat(change) || 0
        );
      }
      
      // Close payment modal
      setShowPaymentModal(false);
      
      // Show receipt modal
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(t('pos:payment.error'));
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Calculate change
  const calculateChange = (value) => {
    const amount = parseFloat(value) || 0;
    setAmountReceived(value);
    setChange(Math.max(0, amount - total));
  };
  
  // Print receipt
  const printReceiptHandler = () => {
    if (currentReceipt) {
      printReceipt(
        currentReceipt, 
        t, 
        (amount) => formatCurrency(amount, settings.currency)
      );
    }
  };
  
  // Helper function to format currency with current settings
  const formatPriceWithCurrency = (amount) => {
    return formatCurrency(amount, settings.currency);
  };
  
  // Format date according to user's settings
  const formatDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    
    // Format based on user preference
    switch (settings.dateFormat) {
      case 'dd/mm/yyyy':
        return format(d, 'dd/MM/yyyy HH:mm:ss');
      case 'yyyy-mm-dd':
        return format(d, 'yyyy-MM-dd HH:mm:ss');
      case 'mm/dd/yyyy':
      default:
        return format(d, 'MM/dd/yyyy HH:mm:ss');
    }
  };
  
  // Get the translated unit name for a product
  const getUnitName = (product) => {
    if (!product || !product.unit) return t('pos:units.default');
    
    // Try to get the proper translation for this specific unit
    const unitKey = product.unit.toLowerCase();
    
    // Try direct translation first (this will catch all abbreviations we added directly to the translation files)
    return t(`pos:units.${unitKey}`, { defaultValue: unitKey });
  };
  
  // Complete sale function
  const completeSale = async (paymentMethod, amountReceived = 0, change = 0, cashPortion = 0, cardPortion = 0) => {
    if (cartItems.length === 0) {
      toast.error(t('pos:payment.emptyCart'));
      return;
    }
    
    try {
      // Format cart items for the database
      const receiptNumber = `INV-${format(new Date(), 'yyyyMMdd-HHmmss')}`;
    
      // Prepare sale data
      const saleData = {
        receipt_number: receiptNumber,
        subtotal: subtotal,
        discount_amount: discount,  // Include discount amount
        tax_amount: tax,
        total_amount: total,
        payment_method: paymentMethod,
        amount_paid: parseFloat(amountReceived) || total,
        change_amount: parseFloat(change) || 0,
        cash_amount: paymentMethod === 'split' ? cashPortion : (paymentMethod === 'cash' ? amountReceived : 0),
        card_amount: paymentMethod === 'split' ? cardPortion : (paymentMethod === 'card' ? total : 0),
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
      
      // Create the sale
      const sale = await SaleService.createSale(saleData, saleItems);
      
      // Refresh the products list to update stock quantities
      try {
        const updatedProducts = await ProductService.getAllProducts();
        setProducts(updatedProducts);
        
        // Update filtered products as well
        let filtered = updatedProducts;
        if (searchQuery) {
          filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.barcode && product.barcode.includes(searchQuery))
          );
        }
        if (selectedCategory) {
          filtered = filtered.filter(product => product.category_id === selectedCategory);
        }
        setFilteredProducts(filtered);
      } catch (error) {
        console.error('Error refreshing products after sale:', error);
      }
      
      // Check for low stock items if notifications are enabled - moved outside of try/catch so it runs even if product refresh fails
      const lowStockItems = [];
      if (settings.enableNotifications) {
        console.log('Checking for low stock items, notifications enabled:', settings.enableNotifications);
        // Get fresh product data for each cart item to check stock
        for (const item of cartItems) {
          try {
            // Get the latest product data directly from the database
            const freshProduct = await ProductService.getProductById(item.id);
            if (!freshProduct) {
              console.log(`No product found for ID ${item.id}`);
              continue;
            }
            
            // Add diagnostic logging
            console.log('Fresh product details:', {
              name: freshProduct.name,
              currentStock: freshProduct.stock_quantity,
              minThreshold: freshProduct.min_stock_threshold,
              thresholdType: typeof freshProduct.min_stock_threshold
            });
            
            // Show notification if stock is at or below threshold
            const minThreshold = parseInt(freshProduct.min_stock_threshold) || 0;
            
            // Debug the condition
            console.log(`Stock check: ${freshProduct.stock_quantity} <= ${minThreshold} = ${freshProduct.stock_quantity <= minThreshold}`);
            
            if (freshProduct.stock_quantity <= minThreshold) {
              console.log(`Adding low stock notification for ${freshProduct.name} - Current Stock: ${freshProduct.stock_quantity}, Threshold: ${minThreshold}`);
              
              // Add to notification list
              lowStockItems.push({
                name: freshProduct.name,
                currentStock: freshProduct.stock_quantity,
                threshold: minThreshold
              });
            }
          } catch (error) {
            console.error(`Error checking stock for product ${item.id}:`, error);
          }
        }
        
        console.log(`Final low stock items count: ${lowStockItems.length}`);
      }
      
      // Show receipt
      setCurrentReceipt({
        ...saleData,
        items: cartItems,
        businessName: settings.businessName,
        businessAddress: settings.businessAddress,
        businessPhone: settings.businessPhone,
        businessEmail: settings.businessEmail,
        receiptHeader: settings.receiptHeader,
        receiptFooter: settings.receiptFooter || t('pos:receipt.thankYou'),
        amountPaid: amountReceived,
        changeAmount: change,
        total: total,
        tax: tax,
        discount: discount,
        subtotal: subtotal,
        date: formatDate(new Date()),
        cashAmount: cashPortion,
        cardAmount: cardPortion
      });
      
      // Show success message
      toast.success(t('pos:notifications.saleCompleted', { 
        amount: formatPriceWithCurrency(total) 
      }), {
        duration: 5000,
        icon: '💰',
        style: {
          background: '#ecfdf5',
          color: '#065f46',
          border: '1px solid #6ee7b7',
          fontWeight: 'bold'
        }
      });
      
      // Show low stock notifications if any
      if (lowStockItems.length > 0) {
        // Show individual notifications
        setTimeout(() => {
          lowStockItems.forEach((item, index) => {
            setTimeout(() => {
              console.log(`Showing notification for ${item.name}`);
              toast(
                `${item.name} ${t('pos:notifications.lowStock', { 
                  current: item.currentStock,
                  threshold: item.threshold
                })}`,
                { 
                  duration: 8000,
                  icon: '⚠️',
                  style: {
                    background: '#fffbeb',
                    color: '#92400e',
                    border: '1px solid #fbbf24',
                    fontWeight: 'bold',
                    padding: '16px',
                    fontSize: '16px'
                  }
                }
              );
            }, index * 800); // Stagger notifications
          });
        }, 1200); // Delay after the summary notification
      }
      
      // Clear cart
      clearCart();
      setIsReceipt(true);
      
      // Reset payment state
      setAmountReceived('');
      setChange(0);
      setCashAmount('');
      setCardAmount('');
      setSplitChange(0);
      setPaymentMethod('cash');
      clearDiscount(); // Clear the discount when cart is cleared
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error(t('pos:payment.error'));
      throw error; // Re-throw the error to be caught by processPayment
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
                  <div className="product-price">{formatPriceWithCurrency(product.selling_price)}</div>
                  <div className="product-stock">
                    {product.stock_quantity <= 0 
                      ? t('pos:productGrid.outOfStock') 
                      : t('pos:productGrid.inStock', { count: product.stock_quantity, unit: getUnitName(product) })}
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
                      <div className="item-price">{formatPriceWithCurrency(item.price)} × 
                        <input
                          type="number"
                          min="1"
                          max={item.product.stock_quantity}
                          value={item.quantity}
                          onChange={(e) => updateCartItemQuantity(item.id, parseInt(e.target.value))}
                          className="quantity-input"
                        />
                        <span className="unit-name">{getUnitName(item.product)}</span>
                      </div>
                    </div>
                    <div className="item-actions">
                      <span className="item-total">{formatPriceWithCurrency(item.totalPrice)}</span>
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
              <span>{formatPriceWithCurrency(subtotal)}</span>
            </div>
            
            {/* Discount section */}
            <div className="discount-section">
              <div className="discount-controls">
                <select 
                  value={discountType} 
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="discount-type-select"
                >
                  <option value="percentage">{t('pos:discount.percentage')}</option>
                  <option value="fixed">{t('pos:discount.fixed')}</option>
                  <option value="total">{t('pos:discount.total')}</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'percentage' ? '100' : subtotal}
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={
                    discountType === 'percentage' ? '0%' : 
                    discountType === 'total' ? t('pos:discount.desiredTotal') : '0.00'
                  }
                  className="discount-input"
                />
                <button 
                  onClick={clearDiscount}
                  className="clear-discount"
                  disabled={!discount}
                >
                  ×
                </button>
              </div>
              {discount > 0 && (
                <div className="summary-row discount-row">
                  <span>{t('pos:summary.discount')}:</span>
                  <span>-{formatPriceWithCurrency(discount)}</span>
                </div>
              )}
            </div>
            
            {settings.enableTax && (
              <div className="summary-row">
                <span>{t('pos:summary.tax', { rate: `${settings.taxRate}%` })}:</span>
                <span>{formatPriceWithCurrency(tax)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>{t('pos:summary.total')}:</span>
              <span>{formatPriceWithCurrency(total)}</span>
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
            <button 
              className="payment-button split"
              onClick={() => {
                setPaymentMethod('split');
                setCashAmount('');
                setCardAmount(total.toFixed(2));
                setSplitChange(0);
                setShowPaymentModal(true);
              }}
              disabled={cartItems.length === 0}
            >
              {t('pos:payment.split')}
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
                    <span>{formatPriceWithCurrency(total)}</span>
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
                      <span>{formatPriceWithCurrency(change)}</span>
                    </div>
                  </div>
                )}

                {paymentMethod === 'split' && (
                  <div className="split-payment-form">
                    <div className="form-group">
                      <label>{t('pos:payment.cashPortion')}:</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cashAmount}
                        onChange={(e) => calculateSplitPayment(e.target.value)}
                        className="amount-input"
                        autoFocus
                      />
                      {splitChange > 0 && (
                        <div className="change-amount">
                          <span>{t('pos:payment.change')}:</span>
                          <span>{formatPriceWithCurrency(splitChange)}</span>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>{t('pos:payment.cardPortion')}:</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cardAmount}
                        onChange={(e) => setCardAmount(e.target.value)}
                        className="amount-input"
                        disabled={splitChange > 0}
                      />
                    </div>
                    <div className="payment-summary split-total">
                      <div className="summary-row">
                        <span>{t('pos:payment.totalPayment')}:</span>
                        <span>{formatPriceWithCurrency((parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0) - splitChange)}</span>
                      </div>
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
                disabled={
                  (paymentMethod === 'cash' && (parseFloat(amountReceived) || 0) < (total - discountValue)) || 
                  (paymentMethod === 'split' && ((parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0) < (total - discountValue))) ||
                  isProcessing
                }
              >
                {isProcessing ? t('common:processing') : t('pos:payment.complete')}
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
                  {currentReceipt.businessAddress && <p>{currentReceipt.businessAddress}</p>}
                  {currentReceipt.businessPhone && <p>{t('pos:receipt.phone')}: {currentReceipt.businessPhone}</p>}
                  {currentReceipt.businessEmail && <p>{t('pos:receipt.email')}: {currentReceipt.businessEmail}</p>}
                  {currentReceipt.receiptHeader && <p className="receipt-custom-header">{currentReceipt.receiptHeader}</p>}
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
                          <td>{item.name}</td>
                          <td>{item.quantity} {getUnitName(item.product)}</td>
                          <td>{formatPriceWithCurrency(item.price)}</td>
                          <td>{formatPriceWithCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="receipt-summary">
                  <div className="summary-row">
                    <span>{t('pos:summary.subtotal')}:</span>
                    <span>{formatPriceWithCurrency(currentReceipt.subtotal)}</span>
                  </div>
                  {currentReceipt.discount > 0 && (
                    <div className="summary-row discount">
                      <span>{t('pos:summary.discount')}:</span>
                      <span>-{formatPriceWithCurrency(currentReceipt.discount)}</span>
                    </div>
                  )}
                  {currentReceipt.tax > 0 && (
                    <div className="summary-row">
                      <span>{t('pos:summary.tax', { rate: `${settings.taxRate}%` })}:</span>
                      <span>{formatPriceWithCurrency(currentReceipt.tax)}</span>
                    </div>
                  )}
                  <div className="summary-row total">
                    <span>{t('pos:summary.total')}:</span>
                    <span>{formatPriceWithCurrency(currentReceipt.total)}</span>
                  </div>
                  <div className="summary-row">
                    <span>{t('pos:receipt.paymentMethod')}:</span>
                    <span>{t(`pos:paymentMethods.${currentReceipt.payment_method}`)}</span>
                  </div>
                  
                  {currentReceipt.payment_method === 'split' ? (
                    <>
                      <div className="summary-row">
                        <span>{t('pos:receipt.cashAmount')}:</span>
                        <span>{formatPriceWithCurrency(currentReceipt.cashAmount)}</span>
                      </div>
                      <div className="summary-row">
                        <span>{t('pos:receipt.cardAmount')}:</span>
                        <span>{formatPriceWithCurrency(currentReceipt.cardAmount)}</span>
                      </div>
                      {currentReceipt.changeAmount > 0 && (
                        <div className="summary-row">
                          <span>{t('pos:receipt.change')}:</span>
                          <span>{formatPriceWithCurrency(currentReceipt.changeAmount)}</span>
                        </div>
                      )}
                    </>
                  ) : currentReceipt.payment_method === 'cash' && (
                    <>
                      <div className="summary-row">
                        <span>{t('pos:receipt.amountReceived')}:</span>
                        <span>{formatPriceWithCurrency(currentReceipt.amountPaid)}</span>
                      </div>
                      <div className="summary-row">
                        <span>{t('pos:receipt.change')}:</span>
                        <span>{formatPriceWithCurrency(currentReceipt.changeAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="thank-you">
                  <p>{currentReceipt.receiptFooter || t('pos:receipt.thankYou')}</p>
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
                onClick={printReceiptHandler}
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
