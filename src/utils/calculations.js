/**
 * Format currency amount to TRY
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted amount with currency symbol
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: 'TRY'
  }).format(amount);
};

/**
 * Calculate the total price of items in a cart
 * @param {Array} items - Array of items with price and quantity
 * @returns {number} - Total price
 */
export const calculateTotal = (items) => {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

/**
 * Calculate subtotal (total before tax)
 * @param {Array} items - Array of items with price and quantity
 * @returns {number} - Subtotal
 */
export const calculateSubtotal = (items) => {
  return calculateTotal(items);
};

/**
 * Calculate tax amount based on subtotal and tax rate
 * @param {number} subtotal - Subtotal amount
 * @param {number} taxRate - Tax rate as percentage (e.g., 8.5 for 8.5%)
 * @returns {number} - Tax amount
 */
export const calculateTax = (subtotal, taxRate) => {
  return subtotal * (taxRate / 100);
};

/**
 * Calculate change amount
 * @param {number} amountPaid - Amount paid by customer
 * @param {number} totalDue - Total amount due
 * @returns {number} - Change amount
 */
export const calculateChange = (amountPaid, totalDue) => {
  return Math.max(0, amountPaid - totalDue);
};

/**
 * Calculate total for returned items
 * @param {Array} items - Array of items with price/unit_price and returnQuantity
 * @returns {number} - Total return amount
 */
export const calculateReturnTotal = (items) => {
  if (!items || !Array.isArray(items)) return 0;
  
  return items.reduce((total, item) => {
    // Handle both price and unit_price property names for flexibility
    const price = item.unit_price !== undefined ? item.unit_price : item.price;
    const returnQty = item.returnQuantity || 0;
    
    if (isNaN(price) || isNaN(returnQty)) {
      console.warn('Invalid price or quantity in return calculation:', item);
      return total;
    }
    
    return total + (price * returnQty);
  }, 0);
}; 