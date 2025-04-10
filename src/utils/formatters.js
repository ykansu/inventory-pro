/**
 * Formats a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (e.g. 'usd', 'eur')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'usd') => {
  // Handle undefined, null, or NaN values
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }
  
  const currencySymbols = {
    usd: '$',
    eur: '€',
    gbp: '£',
    try: '₺'
  };
  
  const symbol = currencySymbols[currency.toLowerCase()] || '$';
  
  // Format with exactly 2 decimal places
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Safely formats a date using toLocaleString
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - The options for toLocaleString
 * @param {string} defaultValue - The default value to return if date is invalid
 * @returns {string} Formatted date string or default value
 */
export const formatDate = (date, options = {}, defaultValue = '') => {
  try {
    // Handle undefined, null, or invalid dates
    if (date === undefined || date === null) {
      return defaultValue;
    }
    
    // Convert string or number to Date object if needed
    let dateObj = date;
    if (!(date instanceof Date)) {
      dateObj = new Date(date);
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return defaultValue;
    }
    
    return dateObj.toLocaleString('default', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return defaultValue;
  }
};

/**
 * Gets the short month name from a date
 * @param {Date|string|number} date - The date
 * @returns {string} Short month name (e.g. 'Jan')
 */
export const getShortMonthName = (date) => {
  return formatDate(date, { month: 'short' }, 'Unknown');
}; 