/**
 * Formats a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (e.g. 'usd', 'eur')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'usd') => {
  const currencySymbols = {
    usd: '$',
    eur: '€',
    gbp: '£',
    try: '₺'
  };
  
  const symbol = currencySymbols[currency.toLowerCase()] || '$';
  return `${symbol}${amount.toLocaleString()}`;
}; 