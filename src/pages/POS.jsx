import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ProductService, CategoryService, SaleService } from '../services/DatabaseService';
import { useSettings } from '../context/SettingsContext';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/calculations';
import { printReceipt } from '../utils/receiptPrinter';
import styles from './POS.module.css';

// Component imports
import SearchBar from '../components/POS/SearchBar';
import CategoryFilter from '../components/POS/CategoryFilter';
import ProductGrid from '../components/POS/ProductGrid';
import Cart from '../components/POS/Cart';
import CartSummary from '../components/POS/CartSummary';
import PaymentActions from '../components/POS/PaymentActions';
import PaymentModal from '../components/POS/PaymentModal';
import ReceiptModal from '../components/POS/ReceiptModal';

const POS = () => {
  const { t } = useTranslation(['pos', 'common', 'products']);
  const { 
    getBusinessName, 
    getBusinessAddress, 
    getBusinessPhone, 
    getBusinessEmail, 
    getCurrency, 
    getDateFormat, 
    getReceiptHeader, 
    getReceiptFooter,
    getNotificationsEnabled
  } = useSettings();
  
  // State for products, categories, cart, and search
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoryFilterCollapsed, setIsCategoryFilterCollapsed] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // State for totals calculation
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [discount, setDiscount] = useState(0); // Discount amount
  const [discountType, setDiscountType] = useState('fixed'); // 'percentage' or 'fixed' or 'total'
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
    
    // Load products and categories
    const loadData = async () => {
      try {
        const allProducts = await ProductService.getAllProducts();
        setProducts(allProducts);
        setFilteredProducts(allProducts);
        
        const allCategories = await CategoryService.getAllCategories();
        setCategories(allCategories);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Calculate totals whenever cart items or discount change
  useEffect(() => {
    const newSubtotal = parseFloat(cartItems.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0).toFixed(2));
    
    // Apply discount to subtotal
    const discountedSubtotal = parseFloat(Math.max(0, newSubtotal - discount).toFixed(2));
    
    setSubtotal(newSubtotal);
    setTotal(discountedSubtotal);
  }, [cartItems, discount]);
  
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
      item.totalPrice = parseFloat((item.quantity * parseFloat(item.price)).toFixed(2));
      setCartItems(updatedCart);
    } else {
      // Add new item to cart
      const newItem = {
        id: product.id,
        name: product.name,
        price: parseFloat(product.selling_price),
        quantity: 1,
        totalPrice: parseFloat(product.selling_price),
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
          totalPrice: parseFloat((quantity * parseFloat(item.price)).toFixed(2))
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
        setDiscount(parseFloat(((subtotal * value) / 100).toFixed(2)));
      }
    } else if (discountType === 'total') {
      // Calculate discount based on desired total
      // Ensure desired total doesn't exceed subtotal
      if (value > subtotal) {
        // If desired total is higher than subtotal, no discount
        setDiscount(0);
      } else {
        // Calculate the discount as the difference between subtotal and desired total
        setDiscount(parseFloat((subtotal - value).toFixed(2)));
      }
    } else { // fixed amount
      // Ensure fixed discount doesn't exceed subtotal
      if (value > subtotal) {
        setDiscountValue(subtotal.toFixed(2));
        setDiscount(subtotal);
      } else {
        setDiscount(parseFloat(value.toFixed(2)));
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
    // Ensure we're working with a valid number
    const cashValue = parseFloat(cash) || 0;
    
    // Store the raw input value so the user can continue editing
    setCashAmount(cash);
    
    // Calculate how much should be paid by card after cash payment
    const remainingAmount = parseFloat(Math.max(0, total - cashValue).toFixed(2));
    setCardAmount(remainingAmount.toFixed(2));
    
    // If cash exceeds total, calculate change
    const changeAmount = parseFloat(Math.max(0, cashValue - total).toFixed(2));
    setSplitChange(changeAmount);
  };
  
  // Process payment
  const processPayment = async () => {
    if (cartItems.length === 0) {
      alert(t('pos:payment.emptyCart'));
      return;
    }
    
    // Validation for different payment methods
    if (paymentMethod === 'cash') {
      const amountPaid = parseFloat(amountReceived) || 0;
      
      if (amountPaid < total) {
        // Calculate the difference as potential discount
        const shortfall = parseFloat((total - amountPaid).toFixed(2));
        
        // Ask user if they want to apply this as a discount
        const confirmDiscount = window.confirm(
          `${t('pos:payment.shortfallPrompt', { 
            shortfall: formatPriceWithCurrency(shortfall) 
          })} ${t('pos:payment.applyAsDiscount')}`
        );
        
        if (confirmDiscount) {
          // Apply the difference as a fixed discount
          const updatedDiscount = parseFloat(shortfall.toFixed(2));
          
          try {
            setIsProcessing(true);
            
            // Create adjusted total for the sale
            const adjustedTotal = parseFloat((total - updatedDiscount).toFixed(2));
            
            // Complete the sale with the discount applied
            await completeSale(
              paymentMethod,
              amountPaid,
              0, // No change as amount equals new total
              0,
              0,
              updatedDiscount // Pass the discount explicitly
            );
            
            // Close payment modal
            setShowPaymentModal(false);
            
            // Show receipt modal
            setShowReceiptModal(true);
          } catch (error) {
            console.error('Error processing payment with discount:', error);
            toast.error(t('pos:payment.error'));
          } finally {
            setIsProcessing(false);
          }
          
          return;
        } else {
          // User doesn't want to apply discount
          alert(t('pos:payment.insufficientAmount'));
          return;
        }
      }
    }
    
    if (paymentMethod === 'split') {
      const cashValue = parseFloat(cashAmount) || 0;
      const cardValue = parseFloat(cardAmount) || 0;
      const totalPayment = parseFloat((cashValue + cardValue).toFixed(2));
      
      if (totalPayment < total) {
        alert(t('pos:payment.insufficientSplitAmount'));
        return;
      }
    }
    
    try {
      setIsProcessing(true);
      
      // Call the completeSale function with the appropriate parameters
      if (paymentMethod === 'split') {
        const cashValue = parseFloat(cashAmount) || 0;
        const cardValue = parseFloat(cardAmount) || 0;
        const totalPaid = parseFloat((cashValue + cardValue).toFixed(2));
        const changeAmount = parseFloat(Math.max(0, totalPaid - total).toFixed(2));
        
        await completeSale(
          'split',
          totalPaid,
          changeAmount,
          cashValue,
          cardValue
        );
      } else {
        const amountPaid = parseFloat(amountReceived) || total;
        const changeAmount = parseFloat(Math.max(0, amountPaid - total).toFixed(2));
        
        await completeSale(
          paymentMethod,
          amountPaid,
          changeAmount
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
    
    if (amount < total) {
      // Amount is less than total, no change to calculate
      setChange(0);
    } else {
      // Calculate change normally
      setChange(parseFloat(Math.max(0, amount - total).toFixed(2)));
    }
  };
  
  // Print receipt
  const printReceiptHandler = () => {
    if (currentReceipt) {
      printReceipt({
        t,
        formatCurrency: (amount) => formatCurrency(amount, getCurrency()),
        sale: {
          ...currentReceipt,
          items: currentReceipt.items.map(item => ({
            ...item,
            total_price: item.totalPrice,
            product_name: item.name
          }))
        },
        business: {
          name: currentReceipt.businessName,
          address: currentReceipt.businessAddress,
          phone: currentReceipt.businessPhone,
          email: currentReceipt.businessEmail
        },
        receiptHeader: currentReceipt.receiptHeader,
        receiptFooter: currentReceipt.receiptFooter
      });
    }
  };
  
  // Format price with currency from settings
  const formatPriceWithCurrency = (amount) => {
    return formatCurrency(amount, getCurrency());
  };
  
  // Format date according to user's settings
  const formatDate = (date) => {
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return date; // If invalid date, return as is
    }
    
    try {
      switch (getDateFormat()) {
        case 'mm/dd/yyyy':
          return format(dateObj, 'MM/dd/yyyy');
        case 'dd/mm/yyyy':
          return format(dateObj, 'dd/MM/yyyy');
        case 'yyyy-mm-dd':
          return format(dateObj, 'yyyy-MM-dd');
        default:
          return format(dateObj, 'MM/dd/yyyy');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return date;
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
  
  // Complete sale with either single or split payment
  const completeSale = async (paymentMethod, amountReceived = 0, change = 0, cashPortion = 0, cardPortion = 0, explicitDiscount = null) => {
    if (cartItems.length === 0) {
      toast.error(t('pos:payment.emptyCart'));
      return;
    }
    
    try {
      // Format cart items for the database
      const receiptNumber = `INV-${format(new Date(), 'yyyyMMdd-HHmmss')}`;
      
      // Use explicit discount if provided, otherwise use the current discount state
      const discountAmount = explicitDiscount !== null ? explicitDiscount : discount;
      // Calculate the adjusted total
      const finalSubtotal = subtotal;
      const finalTotal = explicitDiscount !== null 
        ? parseFloat(Math.max(0, subtotal - explicitDiscount).toFixed(2))
        : total;
    
      // Prepare sale data
      const saleData = {
        receipt_number: receiptNumber,
        subtotal: parseFloat(finalSubtotal),
        discount_amount: parseFloat(discountAmount),
        tax_amount: 0, // Always set tax_amount to 0
        total_amount: parseFloat(finalTotal),
        payment_method: paymentMethod,
        amount_paid: parseFloat(amountReceived) || parseFloat(finalTotal),
        change_amount: parseFloat(change) || 0,
        cash_amount: paymentMethod === 'split' ? parseFloat(cashPortion) : (paymentMethod === 'cash' ? parseFloat(amountReceived) : 0),
        card_amount: paymentMethod === 'split' ? parseFloat(cardPortion) : (paymentMethod === 'card' ? parseFloat(finalTotal) : 0),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Prepare sale items
      const saleItems = cartItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.price),
        discount_amount: 0, // Discount functionality could be added later
        total_price: parseFloat(item.totalPrice)
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
      if (getNotificationsEnabled()) {
        console.log('Checking for low stock items, notifications enabled:', getNotificationsEnabled());
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
        businessName: getBusinessName(),
        businessAddress: getBusinessAddress(),
        businessPhone: getBusinessPhone(),
        businessEmail: getBusinessEmail(),
        receiptHeader: getReceiptHeader(),
        receiptFooter: getReceiptFooter() || t('pos:receipt.thankYou'),
        amountPaid: amountReceived,
        changeAmount: change,
        total: finalTotal,
        discount: discountAmount,
        subtotal: finalSubtotal,
        date: formatDate(new Date()),
        cashAmount: cashPortion,
        cardAmount: cardPortion
      });
      
      // Show success message
      toast.success(t('pos:notifications.saleCompleted', { 
        amount: formatPriceWithCurrency(finalTotal) 
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
  
  // Handlers for opening payment modals
  const handleCashPayment = () => {
    setPaymentMethod('cash');
    setAmountReceived(total.toFixed(2));
    setChange(0);
    setShowPaymentModal(true);
  };
  
  const handleCardPayment = () => {
    setPaymentMethod('card');
    setShowPaymentModal(true);
  };
  
  const handleSplitPayment = () => {
    setPaymentMethod('split');
    setCashAmount('');
    setCardAmount(total.toFixed(2));
    setSplitChange(0);
    setShowPaymentModal(true);
  };
  
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.leftPanel}>
          <SearchBar 
            searchQuery={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            onSearch={handleSearch}
            onBarcodeInput={handleBarcodeInput}
            searchInputRef={searchInputRef}
          />

          <CategoryFilter 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            isCollapsed={isCategoryFilterCollapsed}
            onToggleCollapse={() => setIsCategoryFilterCollapsed(!isCategoryFilterCollapsed)}
          />

          <ProductGrid 
            products={filteredProducts}
            onProductSelect={addToCart}
            getUnitName={getUnitName}
            formatPriceWithCurrency={formatPriceWithCurrency}
          />
        </div>

        <Cart 
          cartItems={cartItems}
          onUpdateQuantity={updateCartItemQuantity}
          onRemoveItem={removeCartItem}
          onClearCart={clearCart}
          getUnitName={getUnitName}
          formatPriceWithCurrency={formatPriceWithCurrency}
        >
          <CartSummary 
            subtotal={subtotal}
            total={total}
            discount={discount}
            discountType={discountType}
            discountValue={discountValue}
            onDiscountTypeChange={setDiscountType}
            onDiscountValueChange={setDiscountValue}
            onClearDiscount={clearDiscount}
            formatPriceWithCurrency={formatPriceWithCurrency}
          />

          <PaymentActions 
            onCashPayment={handleCashPayment}
            onCardPayment={handleCardPayment}
            onSplitPayment={handleSplitPayment}
            isCartEmpty={cartItems.length === 0}
            total={total}
          />
        </Cart>
      </div>
      
      {/* Payment Modal */}
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentMethod={paymentMethod}
        amountReceived={amountReceived}
        cashAmount={cashAmount}
        cardAmount={cardAmount}
        splitChange={splitChange}
        change={change}
        total={total}
        onAmountReceivedChange={calculateChange}
        onCashAmountChange={calculateSplitPayment}
        onCardAmountChange={setCardAmount}
        onProcessPayment={processPayment}
        formatPriceWithCurrency={formatPriceWithCurrency}
        isProcessing={isProcessing}
      />
      
      {/* Receipt Modal */}
      <ReceiptModal 
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receipt={currentReceipt}
        formatPriceWithCurrency={formatPriceWithCurrency}
        onPrint={printReceiptHandler}
        receiptRef={receiptRef}
        getUnitName={getUnitName}
      />
    </div>
  );
};

export default POS;
