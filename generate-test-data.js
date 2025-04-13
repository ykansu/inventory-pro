const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { format, addDays, subDays, subMonths, addMinutes } = require('date-fns');

// Configuration
const OUTPUT_DIR = path.join(__dirname, 'test-data');
const START_DATE = subMonths(new Date(), 12); // Start 12 months ago
const END_DATE = new Date(); // Today
const MIN_TRANSACTIONS_PER_DAY = 100;
const MAX_TRANSACTIONS_PER_DAY = 200;
const MAX_ITEMS_PER_TRANSACTION = 30;
const RECEIPT_PREFIX = 'TEST-';

// Payment methods distribution
const PAYMENT_METHODS = [
  { method: 'cash', probability: 0.45 },
  { method: 'card', probability: 0.40 },
  { method: 'split', probability: 0.15 }
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load product data
const base_products = [
  // Products from the database (imported from your provided list)
  { id: 1, name: 'AMİGURUMİ CIMBIZI', category_id: 6, selling_price: 35, cost_price: 19, stock_quantity: 34, min_stock_threshold: 10 },
  { id: 2, name: 'ANAHTARLIK HALKASI 4 LÜ', category_id: 8, selling_price: 10, cost_price: 6, stock_quantity: 198, min_stock_threshold: 10 },
  { id: 3, name: 'AYARLABİLİR ASKI LEOPAR', category_id: 9, selling_price: 70, cost_price: 44, stock_quantity: 10, min_stock_threshold: 2 },
  { id: 4, name: 'BEBE DÜĞMES 6 LI', category_id: 4, selling_price: 15, cost_price: 4, stock_quantity: 1000, min_stock_threshold: 200 },
  { id: 5, name: 'BEYAZ MEKİK', category_id: 5, selling_price: 10, cost_price: 6.5, stock_quantity: 120, min_stock_threshold: 24 },
  { id: 6, name: 'BEYAZ ŞİŞ ÖLÇER', category_id: 15, selling_price: 45, cost_price: 29, stock_quantity: 20, min_stock_threshold: 4 },
  { id: 7, name: 'BONCUK AHŞAP RENKLİ', category_id: 21, selling_price: 15, cost_price: 10, stock_quantity: 155, min_stock_threshold: 32 },
  { id: 8, name: 'BÜYÜK ARMA', category_id: 8, selling_price: 10, cost_price: 6, stock_quantity: 650, min_stock_threshold: 130 },
  { id: 9, name: 'Ç. AYARLANABİLİR ASKI 2X120', category_id: 9, selling_price: 50, cost_price: 37.5, stock_quantity: 50, min_stock_threshold: 10 },
  { id: 10, name: 'Ç. ÇANTA TABANI OVAL KARE', category_id: 10, selling_price: 50, cost_price: 32, stock_quantity: 99, min_stock_threshold: 20 },
  { id: 11, name: 'Ç. KİLİTLİ KAPAK BÜYÜK', category_id: 8, selling_price: 80, cost_price: 50, stock_quantity: 25, min_stock_threshold: 5 },
  { id: 12, name: 'Ç. KİLİTLİ KAPAK KÜÇÜK', category_id: 8, selling_price: 65, cost_price: 41, stock_quantity: 21, min_stock_threshold: 5 },
  { id: 13, name: 'Ç. MIKNATIS METAL', category_id: 8, selling_price: 10, cost_price: 9, stock_quantity: 298, min_stock_threshold: 60 },
  { id: 14, name: 'ÇANTA HALKASI YAYLI 2 li', category_id: 8, selling_price: 15, cost_price: 12.5, stock_quantity: 200, min_stock_threshold: 40 },
  { id: 15, name: 'ÇANTA KANCASI BÜYÜK 2 li', category_id: 8, selling_price: 15, cost_price: 9, stock_quantity: 347, min_stock_threshold: 70 },
  { id: 16, name: 'ÇANTA SÜSÜ', category_id: 8, selling_price: 50, cost_price: 32, stock_quantity: 21, min_stock_threshold: 5 },
  { id: 17, name: 'ÇANTA TOKALARI', category_id: 8, selling_price: 30, cost_price: 19, stock_quantity: 113, min_stock_threshold: 23 },
  { id: 18, name: 'ÇANTA ZİNCİRİ', category_id: 8, selling_price: 30, cost_price: 20, stock_quantity: 40, min_stock_threshold: 8 },
  { id: 19, name: 'ÇANTA ZİNCİRİ KANCALI', category_id: 8, selling_price: 45, cost_price: 32.5, stock_quantity: 131, min_stock_threshold: 27 },
  { id: 20, name: 'ÇENGELLİ İĞNE BÜYÜK', category_id: 1, selling_price: 25, cost_price: 12.5, stock_quantity: 20, min_stock_threshold: 4 },
  { id: 307, name: 'Puffy', category_id: 28, selling_price: 55, cost_price: 38.28, stock_quantity: 129, min_stock_threshold: 20 },
  { id: 308, name: 'Alize Cotton Gold', category_id: 28, selling_price: 65, cost_price: 54.2, stock_quantity: 120, min_stock_threshold: 24 },
  { id: 309, name: 'Velluto', category_id: 28, selling_price: 50, cost_price: 39.2, stock_quantity: 110, min_stock_threshold: 24 },
  { id: 310, name: 'Maxi', category_id: 28, selling_price: 55, cost_price: 39.2, stock_quantity: 120, min_stock_threshold: 24 },
  { id: 311, name: 'Angora Gold', category_id: 28, selling_price: 56, cost_price: 40, stock_quantity: 114, min_stock_threshold: 24 },
  { id: 312, name: 'Angora Gold Simli', category_id: 28, selling_price: 60, cost_price: 42.8, stock_quantity: 120, min_stock_threshold: 24 },
  { id: 313, name: 'Elit Baby', category_id: 29, selling_price: 52, cost_price: 37, stock_quantity: 115, min_stock_threshold: 24 },
  { id: 323, name: '500cc Multi Surface Akrilik Boya', category_id: 32, selling_price: 230, cost_price: 196, stock_quantity: 16, min_stock_threshold: 4 },
  { id: 325, name: 'Funny Kids 12\'li Multımix Set', category_id: 32, selling_price: 230, cost_price: 152, stock_quantity: 1, min_stock_threshold: 1 },
  { id: 334, name: 'Fatih Akrilik Boya 75cc Pastel', category_id: 32, selling_price: 40, cost_price: 25, stock_quantity: 11, min_stock_threshold: 3 },
  { id: 351, name: 'Rich Master Akrilik 120cc', category_id: 32, selling_price: 65, cost_price: 46, stock_quantity: 89, min_stock_threshold: 19 }
];


let currentId = 1;
let products = [];
while (products.length < 500) {
  const template = base_products[Math.floor(Math.random() * base_products.length)];
  const newProduct = {
    ...template,
    id: currentId,
    name: `${template.name} #${currentId}`, // to make names unique
    selling_price: +(template.selling_price + Math.random() * 10).toFixed(2),
    cost_price: +(template.cost_price + Math.random() * 5).toFixed(2),
    stock_quantity: Math.floor(template.stock_quantity + Math.random() * 50),
    min_stock_threshold: Math.max(1, Math.floor(template.min_stock_threshold + Math.random() * 5))
  };
  products.push(newProduct);
  currentId++;
}

// Load categories (simplified based on products)
const categories = [
  { id: 1, name: 'İğneler' },
  { id: 4, name: 'Düğmeler' },
  { id: 5, name: 'Şiş ve Mekikler' },
  { id: 6, name: 'Tığlar ve Cımbızlar' },
  { id: 7, name: 'İpler' },
  { id: 8, name: 'Çanta Aksesuarları' },
  { id: 9, name: 'Askı ve Saplar' },
  { id: 10, name: 'Çanta Tabanları' },
  { id: 15, name: 'Ölçüm Aletleri' },
  { id: 21, name: 'Boncuklar' },
  { id: 24, name: 'Yapıştırıcılar' },
  { id: 28, name: 'Marka İpleri 1' },
  { id: 29, name: 'Marka İpleri 2' },
  { id: 32, name: 'Boyalar' }
];

// Set randomization weights for each product based on their popularity
const productWeights = products.map(product => {
  // Assign weights based on some logic (e.g., cheaper items and yarn are more popular)
  let weight = 1.0;
  
  // Popular categories get higher weights
  if ([7, 8, 28, 29, 32].includes(product.category_id)) {
    weight *= 2.5;
  }
  
  // Cheaper items sell more
  if (product.selling_price < 30) {
    weight *= 1.8;
  } else if (product.selling_price < 50) {
    weight *= 1.5;
  }
  
  return {
    ...product,
    weight
  };
});

// Utility function to get weighted random product
function getWeightedRandomProduct() {
  const totalWeight = productWeights.reduce((sum, product) => sum + product.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const product of productWeights) {
    random -= product.weight;
    if (random <= 0) {
      return product;
    }
  }
  
  return productWeights[0]; // Fallback
}

// Utility function to get weighted payment method
function getRandomPaymentMethod() {
  const random = Math.random();
  let cumulativeProbability = 0;
  
  for (const payment of PAYMENT_METHODS) {
    cumulativeProbability += payment.probability;
    if (random <= cumulativeProbability) {
      return payment.method;
    }
  }
  
  return PAYMENT_METHODS[0].method; // Fallback
}

// Track receipt numbers to ensure uniqueness
const usedReceiptNumbers = new Set();

// Generate a unique receipt number
function generateUniqueReceiptNumber(date, transactionIndex) {
  const dateStr = format(date, 'yyyyMMdd');
  const timeStr = format(date, 'HHmmss');
  let receiptNumber;
  
  // Create a receipt number with date, time, and a unique identifier
  receiptNumber = `${RECEIPT_PREFIX}${dateStr}-${timeStr}-${transactionIndex.toString().padStart(4, '0')}`;
  
  // In the unlikely case of a collision, add a UUID fragment
  if (usedReceiptNumbers.has(receiptNumber)) {
    const uniqueSuffix = uuidv4().substring(0, 8);
    receiptNumber = `${RECEIPT_PREFIX}${dateStr}-${timeStr}-${uniqueSuffix}`;
  }
  
  usedReceiptNumbers.add(receiptNumber);
  return receiptNumber;
}

// Generate a complete transaction
function generateTransaction(date, transactionIndex) {
  // Vary transaction times throughout the day (8AM to 7PM)
  const hours = Math.floor(Math.random() * 11) + 8;
  const minutes = Math.floor(Math.random() * 60);
  const transactionDate = addMinutes(addMinutes(date, hours * 60), minutes);
  
  // Generate random number of items
  const itemCount = Math.floor(Math.random() * MAX_ITEMS_PER_TRANSACTION) + 1;
  
  // Selected items
  const selectedItems = [];
  const addedProductIds = new Set();
  
  // Add random items
  for (let i = 0; i < itemCount; i++) {
    // Get random product
    let product;
    do {
      product = getWeightedRandomProduct();
    } while (addedProductIds.has(product.id));
    
    addedProductIds.add(product.id);
    
    // Random quantity (1-5 for most items)
    const quantity = Math.floor(Math.random() * 5) + 1;
    
    // Calculate price (occasionally apply small discount)
    const hasDiscount = Math.random() < 0.2;
    let discount = 0;
    
    if (hasDiscount) {
      discount = product.selling_price * quantity * (Math.random() * 0.1); // Up to 10% discount
      discount = Math.round(discount * 10) / 10; // Round to 1 decimal place
    }
    
    const unitPrice = product.selling_price;
    const totalPrice = (unitPrice * quantity) - discount;
    
    selectedItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity: quantity,
      unit_price: unitPrice,
      discount_amount: discount,
      total_price: totalPrice,
      historical_cost_price: product.cost_price
    });
  }
  
  // Calculate totals
  const subtotal = selectedItems.reduce((sum, item) => sum + item.total_price, 0);
  const taxAmount = 0; // No tax in this example
  const discountAmount = selectedItems.reduce((sum, item) => sum + item.discount_amount, 0);
  const totalAmount = subtotal + taxAmount;
  
  // Generate payment information
  const paymentMethod = getRandomPaymentMethod();
  let cashAmount = 0;
  let cardAmount = 0;
  let amountPaid = totalAmount;
  let changeAmount = 0;
  let splitPaymentInfo = null;
  let paymentMethodDetails = null;
  
  if (paymentMethod === 'cash') {
    // Cash payment (sometimes with extra change)
    cashAmount = totalAmount;
    const extraAmount = Math.random() < 0.7 ? 
      Math.ceil(totalAmount / 10) * 10 - totalAmount : // Round up to nearest 10
      0; // Exact amount
    
    amountPaid = totalAmount + extraAmount;
    changeAmount = extraAmount;
  } else if (paymentMethod === 'card') {
    // Card payment (exact amount)
    cardAmount = totalAmount;
    paymentMethodDetails = JSON.stringify({
      cardType: ['Visa', 'Mastercard', 'Troy'][Math.floor(Math.random() * 3)],
      lastFourDigits: Math.floor(1000 + Math.random() * 9000)
    });
  } else if (paymentMethod === 'split') {
    // Split payment (part cash, part card)
    const cashPortion = totalAmount * (0.3 + Math.random() * 0.4); // 30-70% cash
    cashAmount = Math.round(cashPortion * 10) / 10;
    cardAmount = Math.round((totalAmount - cashAmount) * 10) / 10;
    
    splitPaymentInfo = JSON.stringify({
      cash: cashAmount,
      card: cardAmount
    });
    
    paymentMethodDetails = JSON.stringify({
      cardType: ['Visa', 'Mastercard', 'Troy'][Math.floor(Math.random() * 3)],
      lastFourDigits: Math.floor(1000 + Math.random() * 9000)
    });
  }
  
  // Generate unique receipt number
  const receiptNumber = generateUniqueReceiptNumber(transactionDate, transactionIndex);
  
  // Create transaction object
  return {
    sale: {
      receipt_number: receiptNumber,
      subtotal: subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      amount_paid: amountPaid,
      change_amount: changeAmount,
      cashier: ['Ayşe', 'Mehmet', 'Fatma', 'Ali', 'Zeynep'][Math.floor(Math.random() * 5)],
      cash_amount: cashAmount,
      card_amount: cardAmount,
      split_payment_info: splitPaymentInfo,
      payment_method_details: paymentMethodDetails,
      is_returned: false,
      notes: '',
      created_at: transactionDate.toISOString(),
      updated_at: transactionDate.toISOString()
    },
    sale_items: selectedItems
  };
}

// Generate transactions for each day in the date range
function generateTransactions() {
  const transactions = [];
  let globalTransactionIndex = 1;
  
  // Create random transactions for each day
  let currentDate = new Date(START_DATE);
  while (currentDate <= END_DATE) {
    // Vary number of transactions based on day of week (more on weekends)
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let transactionsToday = Math.floor(Math.random() * 
      (MAX_TRANSACTIONS_PER_DAY - MIN_TRANSACTIONS_PER_DAY + 1)) + MIN_TRANSACTIONS_PER_DAY;
    
    // More transactions on weekends
    if (isWeekend) {
      transactionsToday = Math.ceil(transactionsToday * 1.5);
    }
    
    // Generate transactions for this day
    for (let i = 0; i < transactionsToday; i++) {
      transactions.push(generateTransaction(currentDate, globalTransactionIndex++));
    }
    
    // Move to next day
    currentDate = addDays(currentDate, 1);
  }
  
  return transactions;
}

// Generate and save JSON data
function generateJsonData() {
  console.log('Generating one year of test data...');
  
  const transactions = generateTransactions();
  console.log(`Generated ${transactions.length} transactions`);
  
  // Process transactions into database tables format
  const sales = [];
  const sale_items = [];
  let saleId = 1;
  let saleItemId = 1;
  
  transactions.forEach(transaction => {
    // Add sale with ID
    const sale = { ...transaction.sale, id: saleId };
    sales.push(sale);
    
    // Add sale items with IDs and sale_id
    transaction.sale_items.forEach(item => {
      const saleItem = { 
        ...item, 
        id: saleItemId++, 
        sale_id: saleId,
        created_at: transaction.sale.created_at,
        updated_at: transaction.sale.updated_at
      };
      sale_items.push(saleItem);
    });
    
    saleId++;
  });
  
  // Add product data
  const now = new Date().toISOString();
  const productsData = products.map(product => ({
    ...product,
    unit: 'pcs',
    created_at: now,
    updated_at: now
  }));
  
  // Add category data
  const categoriesData = categories.map(category => ({
    ...category,
    created_at: now,
    updated_at: now
  }));
  
  // Settings for the import
  const settingsData = [
    { key: 'business_name', value: 'Test Store', type: 'string', description: 'Store name for test data', created_at: now, updated_at: now },
    { key: 'business_address', value: 'Test Address', type: 'string', description: 'Store address for test data', created_at: now, updated_at: now },
    { key: 'business_phone', value: '+90 123 456 7890', type: 'string', description: 'Store phone for test data', created_at: now, updated_at: now },
    { key: 'currency', value: 'TRY', type: 'string', description: 'Currency setting', created_at: now, updated_at: now },
    { key: 'language', value: 'tr', type: 'string', description: 'Language setting', created_at: now, updated_at: now }
  ];
  
  // Create the final JSON structure matching the import format
  const jsonData = {
    metadata: {
      timestamp: new Date().toISOString(),
      appVersion: '1.0.0',
      tables: ['sales', 'sale_items', 'products', 'categories', 'settings']
    },
    data: {
      sales: sales,
      sale_items: sale_items,
      products: productsData,
      categories: categoriesData,
      settings: settingsData,
      product_price_history: [], // Empty table as we don't have historical data
      stock_adjustments: [], // Empty table as we don't track adjustments separately
      expense_categories: [], // Empty table
      expenses: [] // Empty table
    }
  };
  
  // Save JSON file in chunks to reduce memory usage
  const outputPath = path.join(OUTPUT_DIR, `inventory_test_data_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`);
  
  try {
    // Write the file
    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
    console.log(`Test data saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error saving JSON file:', error);
    throw error;
  }
}

// Run the generation process
async function main() {
  try {
    const filePath = generateJsonData();
    console.log(`
=====================================================
Test data generation complete!
=====================================================
File: ${filePath}

This file contains one year of test data with:
- Randomized sales across 365 days
- Realistic transaction patterns (more on weekends)
- Data for all product categories
- Varied payment methods (cash, card, split)

You can import this data using the JSON import feature
in your Inventory Pro application.

Note: Make sure to back up your current data before
importing test data!
=====================================================
`);
  } catch (error) {
    console.error('Error generating test data:', error);
  }
}

// Run the script
main();