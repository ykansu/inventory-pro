/**
 * Utility functions for printing receipts on thermal printers
 * Optimized for 58mm thermal printers (common in retail)
 */

// Constants for 58mm thermal printer
const CHAR_WIDTH = 32; // Standard character count for 58mm paper
const DIVIDER_LINE = '-'.repeat(CHAR_WIDTH);

/**
 * Centers text on the receipt
 * @param {string} text - Text to center
 * @returns {string} - Centered text
 */
export const centerText = (text) => {
  if (!text) return '';
  text = text.trim();
  const spaces = Math.max(0, Math.floor((CHAR_WIDTH - text.length) / 2));
  return ' '.repeat(spaces) + text;
};

/**
 * Creates a left-right aligned row (for key-value pairs)
 * @param {string} left - Left text
 * @param {string} right - Right text
 * @returns {string} - Formatted line
 */
export const formatRow = (left, right) => {
  if (!left) left = '';
  if (!right) right = '';
  
  left = left.trim();
  right = right.trim();
  
  // If combined length is greater than char width, truncate left text
  if (left.length + right.length + 1 > CHAR_WIDTH) {
    left = left.substring(0, CHAR_WIDTH - right.length - 4) + '...';
  }
  
  const spaces = Math.max(1, CHAR_WIDTH - left.length - right.length);
  return left + ' '.repeat(spaces) + right;
};

/**
 * Format a receipt for thermal printing
 * @param {Object} receiptData - Receipt data
 * @returns {string} - Formatted receipt HTML
 */
export const formatReceipt = (receiptData) => {
  if (!receiptData) return '';
  
  // Extract translation function, currency formatter and receipt data
  const { t, formatCurrency, sale, business, receiptHeader, receiptFooter } = receiptData;
  
  // Check if required functions are available
  if (typeof t !== 'function') {
    console.error('Translation function (t) is not provided or is not a function');
    return '<div>Error: Translation function not available</div>';
  }
  
  if (typeof formatCurrency !== 'function') {
    console.error('Currency formatting function is not provided or is not a function');
    return '<div>Error: Currency formatter not available</div>';
  }
  
  const lines = [];
  
  // Header
  lines.push(`<div style="text-align:center; font-weight:bold;">${business.name}</div>`);
  
  if (business.address) {
    lines.push(`<div style="text-align:center;">${business.address}</div>`);
  }
  
  if (business.phone) {
    lines.push(`<div style="text-align:center;">${t('pos:receipt.phone')}: ${business.phone}</div>`);
  }
  
  if (business.email) {
    lines.push(`<div style="text-align:center;">${t('pos:receipt.email')}: ${business.email}</div>`);
  }
  
  // Receipt number and date
  if (sale.receipt_number) {
    lines.push(`<div style="text-align:center;">${t('pos:receipt.number', { number: sale.receipt_number })}</div>`);
  } else if (sale.id) {
    lines.push(`<div style="text-align:center;">${t('pos:receipt.number', { number: sale.id })}</div>`);
  }
  
  // Use formattedDate directly if it exists
  lines.push(`<div style="text-align:center;">${sale.formattedDate || sale.date}</div>`);
  
  // Custom header (if exists)
  if (receiptHeader) {
    lines.push(`<div style="text-align:center; font-style:italic;">${receiptHeader}</div>`);
  }
  
  // Divider
  lines.push(`<div>${DIVIDER_LINE}</div>`);
  
  // Column headers
  lines.push(`<div style="display:flex;">
    <div style="flex:3;">${t('pos:receipt.item')}</div>
    <div style="flex:1; text-align:center;">${t('pos:receipt.quantity')}</div>
    <div style="flex:2; text-align:right;">${t('pos:receipt.total')}</div>
  </div>`);
  
  lines.push(`<div>${DIVIDER_LINE}</div>`);
  
  // Items
  if (sale.items && Array.isArray(sale.items)) {
    sale.items.forEach(item => {
      // If item name is too long, trim it
      let displayName = item.product_name || item.name;
      if (displayName && displayName.length > 20) {
        displayName = displayName.substring(0, 17) + '...';
      }
      
      // Get unit name if product has a unit
      let unitDisplay = '';
      if (item.product && item.product.unit) {
        const unitKey = item.product.unit.toLowerCase();
        // Direct translation from the translation files (all abbreviations are now directly in the translations)
        unitDisplay = t(`pos:units.${unitKey}`, { defaultValue: unitKey });
      }
      
      lines.push(`<div style="display:flex;">
        <div style="flex:3;">${displayName}</div>
        <div style="flex:1; text-align:center;">${item.quantity}${unitDisplay ? ' ' + unitDisplay : ''}</div>
        <div style="flex:2; text-align:right;">${formatCurrency(item.total_price || item.totalPrice)}</div>
      </div>`);
    });
  }
  
  // Divider
  lines.push(`<div>${DIVIDER_LINE}</div>`);
  
  // Summary
  lines.push(`<div style="display:flex; justify-content:space-between;">
    <div>${t('pos:summary.subtotal')}:</div>
    <div>${formatCurrency(sale.subtotal)}</div>
  </div>`);
  
  if (sale.discount > 0 || sale.discount_amount > 0) {
    lines.push(`<div style="display:flex; justify-content:space-between;">
      <div>${t('pos:summary.discount')}:</div>
      <div>-${formatCurrency(sale.discount || sale.discount_amount)}</div>
    </div>`);
  }
  
  // Total (with emphasis)
  lines.push(`<div style="display:flex; justify-content:space-between; font-weight:bold;">
    <div>${t('pos:summary.total')}:</div>
    <div>${formatCurrency(sale.total_amount)}</div>
  </div>`);
  
  // Payment information
  const paymentMethod = sale.payment_method;
  lines.push(`<div style="display:flex; justify-content:space-between;">
    <div>${t('pos:receipt.paymentMethod')}:</div>
    <div>${t(`pos:paymentMethods.${paymentMethod}`)}</div>
  </div>`);
  
  if (paymentMethod === 'split') {
    if (sale.payment_details && Array.isArray(sale.payment_details)) {
      sale.payment_details.forEach(payment => {
        lines.push(`<div style="display:flex; justify-content:space-between;">
          <div>${t(`pos:paymentMethods.${payment.method}`)}:</div>
          <div>${formatCurrency(payment.amount)}</div>
        </div>`);
      });
    } else {
      // Legacy format
      if (sale.cash_amount > 0) {
        lines.push(`<div style="display:flex; justify-content:space-between;">
          <div>${t('pos:receipt.cashAmount')}:</div>
          <div>${formatCurrency(sale.cash_amount)}</div>
        </div>`);
      }
      
      if (sale.card_amount > 0) {
        lines.push(`<div style="display:flex; justify-content:space-between;">
          <div>${t('pos:receipt.cardAmount')}:</div>
          <div>${formatCurrency(sale.card_amount)}</div>
        </div>`);
      }
    }
    
    if (sale.change_amount > 0) {
      lines.push(`<div style="display:flex; justify-content:space-between;">
        <div>${t('pos:receipt.change')}:</div>
        <div>${formatCurrency(sale.change_amount)}</div>
      </div>`);
    }
  } else if (paymentMethod === 'cash') {
    if (sale.amount_paid > 0) {
      lines.push(`<div style="display:flex; justify-content:space-between;">
        <div>${t('pos:receipt.amountReceived')}:</div>
        <div>${formatCurrency(sale.amount_paid)}</div>
      </div>`);
    }
    
    if (sale.change_amount > 0) {
      lines.push(`<div style="display:flex; justify-content:space-between;">
        <div>${t('pos:receipt.change')}:</div>
        <div>${formatCurrency(sale.change_amount)}</div>
      </div>`);
    }
  }
  
  // Footer
  lines.push(`<div>${DIVIDER_LINE}</div>`);
  lines.push(`<div style="text-align:center;">${receiptFooter || t('pos:receipt.thankYou')}</div>`);
  
  return `
    <div style="font-family: 'Courier New', monospace; width: 58mm; font-size: 10px; line-height: 1.2;">
      ${lines.join('\n')}
    </div>
  `;
};

/**
 * Print receipt to thermal printer
 * @param {Object} receiptData - Receipt data with t, formatCurrency, sale and business properties
 */
export const printReceipt = (receiptData) => {
  if (!receiptData) return;
  
  const receiptHTML = formatReceipt(receiptData);
  
  const printWindow = window.open('', '_blank');
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: white;
            font-size: 10px;
            font-family: 'Courier New', monospace;
          }
          @page {
            size: 58mm auto;  /* Width: 58mm, Height: auto */
            margin: 0mm;      /* No margins */
          }
          @media print {
            html, body {
              width: 58mm;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        </style>
      </head>
      <body>
        ${receiptHTML}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  
  // Add a small delay to ensure the window is fully rendered
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 250);
}; 