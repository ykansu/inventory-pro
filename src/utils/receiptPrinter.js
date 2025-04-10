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
 * @param {Object} receipt - Receipt data
 * @param {function} t - Translation function
 * @param {function} formatCurrency - Currency formatting function
 * @returns {string} - Formatted receipt HTML
 */
export const formatReceipt = (receipt, t, formatCurrency) => {
  if (!receipt) return '';
  
  const lines = [];
  
  // Header
  lines.push(`<div style="text-align:center; font-weight:bold;">${receipt.businessName}</div>`);
  
  if (receipt.businessAddress) {
    lines.push(`<div style="text-align:center;">${receipt.businessAddress}</div>`);
  }
  
  if (receipt.businessPhone) {
    lines.push(`<div style="text-align:center;">${t('pos:receipt.phone')}: ${receipt.businessPhone}</div>`);
  }
  
  if (receipt.businessEmail) {
    lines.push(`<div style="text-align:center;">${t('pos:receipt.email')}: ${receipt.businessEmail}</div>`);
  }
  
  // Receipt number and date
  if (receipt.receiptNumber) {
    lines.push(`<div style="text-align:center;">${t('pos:receipt.number', { number: receipt.receiptNumber })}</div>`);
  } else if (receipt.receipt_number) {
    lines.push(`<div style="text-align:center;">${t('pos:receipt.number', { number: receipt.receipt_number })}</div>`);
  }
  
  lines.push(`<div style="text-align:center;">${receipt.date}</div>`);
  
  // Custom header (if exists)
  if (receipt.receiptHeader) {
    lines.push(`<div style="text-align:center; font-style:italic;">${receipt.receiptHeader}</div>`);
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
  receipt.items.forEach(item => {
    // If item name is too long, trim it
    let displayName = item.name;
    if (displayName.length > 20) {
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
      <div style="flex:2; text-align:right;">${formatCurrency(item.totalPrice)}</div>
    </div>`);
  });
  
  // Divider
  lines.push(`<div>${DIVIDER_LINE}</div>`);
  
  // Summary
  lines.push(`<div style="display:flex; justify-content:space-between;">
    <div>${t('pos:summary.subtotal')}:</div>
    <div>${formatCurrency(receipt.subtotal)}</div>
  </div>`);
  
  if (receipt.discount > 0) {
    lines.push(`<div style="display:flex; justify-content:space-between;">
      <div>${t('pos:summary.discount')}:</div>
      <div>-${formatCurrency(receipt.discount)}</div>
    </div>`);
  }
  
  // Total (with emphasis)
  lines.push(`<div style="display:flex; justify-content:space-between; font-weight:bold;">
    <div>${t('pos:summary.total')}:</div>
    <div>${formatCurrency(receipt.total)}</div>
  </div>`);
  
  // Payment information
  const paymentMethod = receipt.paymentMethod || receipt.payment_method;
  lines.push(`<div style="display:flex; justify-content:space-between;">
    <div>${t('pos:receipt.paymentMethod')}:</div>
    <div>${t(`pos:paymentMethods.${paymentMethod}`)}</div>
  </div>`);
  
  if (paymentMethod === 'split') {
    lines.push(`<div style="display:flex; justify-content:space-between;">
      <div>${t('pos:receipt.cashAmount')}:</div>
      <div>${formatCurrency(receipt.cashAmount)}</div>
    </div>`);
    
    lines.push(`<div style="display:flex; justify-content:space-between;">
      <div>${t('pos:receipt.cardAmount')}:</div>
      <div>${formatCurrency(receipt.cardAmount)}</div>
    </div>`);
    
    if (receipt.changeAmount > 0) {
      lines.push(`<div style="display:flex; justify-content:space-between;">
        <div>${t('pos:receipt.change')}:</div>
        <div>${formatCurrency(receipt.changeAmount)}</div>
      </div>`);
    }
  } else if (paymentMethod === 'cash') {
    lines.push(`<div style="display:flex; justify-content:space-between;">
      <div>${t('pos:receipt.amountReceived')}:</div>
      <div>${formatCurrency(receipt.amountPaid)}</div>
    </div>`);
    
    lines.push(`<div style="display:flex; justify-content:space-between;">
      <div>${t('pos:receipt.change')}:</div>
      <div>${formatCurrency(receipt.changeAmount)}</div>
    </div>`);
  }
  
  // Footer
  lines.push(`<div>${DIVIDER_LINE}</div>`);
  lines.push(`<div style="text-align:center;">${receipt.receiptFooter || t('pos:receipt.thankYou')}</div>`);
  
  return `
    <div style="font-family: 'Courier New', monospace; width: 58mm; font-size: 10px; line-height: 1.2;">
      ${lines.join('\n')}
    </div>
  `;
};

/**
 * Print receipt to thermal printer
 * @param {Object} receipt - Receipt data
 * @param {function} t - Translation function
 * @param {function} formatCurrency - Currency formatting function 
 */
export const printReceipt = (receipt, t, formatCurrency) => {
  if (!receipt) return;
  
  const receiptHTML = formatReceipt(receipt, t, formatCurrency);
  
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