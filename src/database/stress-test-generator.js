/**
 * Stress Test Data Generator for Inventory Pro
 * 
 * This script generates realistic test data for stress testing:
 * - One year of historical data
 * - Realistic sales patterns with seasonal trends
 * - Large number of products, categories, suppliers
 * - Realistic stock adjustments
 */

const path = require('path');
const fs = require('fs');
const { format, addDays, subMonths, subDays, getDay, getMonth, differenceInDays } = require('date-fns');
const dbConnection = require('./connection');

// Configuration for test data volume
const CONFIG = {
  // Time period
  START_DATE: subMonths(new Date(), 12), // 1 year ago
  END_DATE: new Date(), // Today
  
  // Entities count
  CATEGORIES_COUNT: 20,
  SUPPLIERS_COUNT: 15,
  PRODUCTS_COUNT: 200,
  
  // Sales volume
  AVG_SALES_PER_DAY: 2, // Average number of sales per day
  WEEKEND_SALES_MULTIPLIER: 1.6, // Sales increase on weekends
  MONTHLY_SEASONALITY: [ // Monthly sales multiplier (1.0 = normal)
    0.8,  // January
    0.75, // February
    0.85, // March
    0.9,  // April
    1.0,  // May
    1.05, // June
    1.1,  // July
    1.2,  // August
    1.1,  // September
    1.15, // October
    1.5,  // November (Black Friday)
    1.8,  // December (Holiday season)
  ],
  
  // Product details
  MIN_COST_PRICE: 5,
  MAX_COST_PRICE: 200,
  MARKUP_MIN: 0.2, // 20%
  MARKUP_MAX: 0.6, // 60%
  
  // Stock adjustments
  STOCK_ADJUSTMENT_FREQUENCY: 0.1, // 10% chance per day per product
};

// Utility functions
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
};
const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];
const randomItems = (arr, min, max) => {
  const count = randomBetween(min, max);
  const result = [];
  const indices = new Set();
  
  while (result.length < count && result.length < arr.length) {
    const index = randomBetween(0, arr.length - 1);
    if (!indices.has(index)) {
      indices.add(index);
      result.push(arr[index]);
    }
  }
  
  return result;
};

// Generate categories
async function generateCategories(db) {
  console.log('Generating categories...');
  
  const categories = [
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Clothing', description: 'Apparel and fashion items' },
    { name: 'Groceries', description: 'Food and grocery items' },
    { name: 'Home & Kitchen', description: 'Household and kitchen supplies' },
    { name: 'Beauty & Personal Care', description: 'Beauty products and personal care items' },
    { name: 'Office Supplies', description: 'Stationery and office equipment' },
    { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' },
    { name: 'Toys & Games', description: 'Toys, games, and entertainment items' },
    { name: 'Books', description: 'Books, magazines, and publications' },
    { name: 'Health & Wellness', description: 'Health supplements and wellness products' },
    { name: 'Automotive', description: 'Car parts and accessories' },
    { name: 'Pet Supplies', description: 'Food and accessories for pets' },
    { name: 'Furniture', description: 'Home and office furniture' },
    { name: 'Tools & Home Improvement', description: 'Tools and home renovation supplies' },
    { name: 'Jewelry', description: 'Jewelry and accessories' },
    { name: 'Baby Products', description: 'Items for babies and infants' },
    { name: 'Crafts & Hobbies', description: 'Craft supplies and hobby items' },
    { name: 'Music Instruments', description: 'Musical instruments and accessories' },
    { name: 'Gardening', description: 'Gardening tools and supplies' },
    { name: 'Seasonal', description: 'Seasonal and holiday items' },
  ];
  
  // Ensure we have the required number of categories
  while (categories.length < CONFIG.CATEGORIES_COUNT) {
    categories.push({
      name: `Category ${categories.length + 1}`,
      description: `Description for category ${categories.length + 1}`
    });
  }
  
  // Add timestamps
  const now = new Date();
  for (const category of categories) {
    category.created_at = now;
    category.updated_at = now;
  }
  
  // Insert categories
  await db('categories').insert(categories);
  return await db('categories').select('*');
}

// Generate suppliers
async function generateSuppliers(db) {
  console.log('Generating suppliers...');
  
  const suppliers = [
    { company_name: 'Global Supply Co.', contact_person: 'John Smith', phone: '555-123-4567', email: 'john@globalsupply.com', address: '123 Main St, New York, NY 10001', tax_id: 'TX12345678', website: 'www.globalsupply.com' },
    { company_name: 'Best Wholesale Inc.', contact_person: 'Sarah Johnson', phone: '555-987-6543', email: 'sarah@bestwholesale.com', address: '456 Market St, Chicago, IL 60607', tax_id: 'TX87654321', website: 'www.bestwholesale.com' },
    { company_name: 'Premier Distributors', contact_person: 'Michael Brown', phone: '555-246-8135', email: 'michael@premierdist.com', address: '789 Oak Ave, Los Angeles, CA 90001', tax_id: 'TX24681357', website: 'www.premierdist.com' },
    { company_name: 'Quality Goods Ltd.', contact_person: 'Jennifer Lee', phone: '555-975-3164', email: 'jennifer@qualitygoods.com', address: '321 Pine St, Seattle, WA 98101', tax_id: 'TX97531642', website: 'www.qualitygoods.com' },
    { company_name: 'Value Merchants', contact_person: 'David Wilson', phone: '555-753-9518', email: 'david@valuemerchants.com', address: '654 Elm Rd, Dallas, TX 75201', tax_id: 'TX75395142', website: 'www.valuemerchants.com' },
    { company_name: 'Royal Imports', contact_person: 'Emma Davis', phone: '555-159-7532', email: 'emma@royalimports.com', address: '987 Cedar Ln, Miami, FL 33101', tax_id: 'TX15975346', website: 'www.royalimports.com' },
    { company_name: 'Superior Products', contact_person: 'Robert Taylor', phone: '555-852-7413', email: 'robert@superiorproducts.com', address: '741 Birch Dr, Boston, MA 02101', tax_id: 'TX85274136', website: 'www.superiorproducts.com' },
    { company_name: 'Zenith Trading', contact_person: 'Lisa Martinez', phone: '555-426-9153', email: 'lisa@zenithtrading.com', address: '258 Maple Ave, Denver, CO 80201', tax_id: 'TX42691537', website: 'www.zenithtrading.com' },
    { company_name: 'Eagle Distributors', contact_person: 'James Anderson', phone: '555-369-1478', email: 'james@eagledist.com', address: '963 Walnut St, Phoenix, AZ 85001', tax_id: 'TX36914785', website: 'www.eagledist.com' },
    { company_name: 'Fresh Harvest', contact_person: 'Patricia Garcia', phone: '555-741-2583', email: 'patricia@freshharvest.com', address: '147 Spruce Ct, Portland, OR 97201', tax_id: 'TX74125836', website: 'www.freshharvest.com' },
    { company_name: 'Tech Innovations', contact_person: 'Thomas Wright', phone: '555-964-2587', email: 'thomas@techinnovations.com', address: '369 Redwood Blvd, San Francisco, CA 94101', tax_id: 'TX96425871', website: 'www.techinnovations.com' },
    { company_name: 'Fashion Forward', contact_person: 'Nancy Miller', phone: '555-852-9674', email: 'nancy@fashionforward.com', address: '741 Chestnut St, Atlanta, GA 30301', tax_id: 'TX85296743', website: 'www.fashionforward.com' },
    { company_name: 'Home Essentials', contact_person: 'Christopher Lewis', phone: '555-357-9514', email: 'chris@homeessentials.com', address: '159 Willow Ln, Houston, TX 77001', tax_id: 'TX35795142', website: 'www.homeessentials.com' },
    { company_name: 'Garden Wonders', contact_person: 'Karen Walker', phone: '555-159-3574', email: 'karen@gardenwonders.com', address: '753 Aspen Rd, Minneapolis, MN 55401', tax_id: 'TX15935742', website: 'www.gardenwonders.com' },
    { company_name: 'Metro Supplies', contact_person: 'Daniel Harris', phone: '555-753-1598', email: 'daniel@metrosupplies.com', address: '951 Birch Dr, Philadelphia, PA 19101', tax_id: 'TX75315984', website: 'www.metrosupplies.com' },
  ];
  
  // Ensure we have the required number of suppliers
  while (suppliers.length < CONFIG.SUPPLIERS_COUNT) {
    suppliers.push({
      company_name: `Supplier ${suppliers.length + 1}`,
      contact_person: `Contact ${suppliers.length + 1}`,
      phone: `555-000-${suppliers.length.toString().padStart(4, '0')}`,
      email: `contact${suppliers.length + 1}@supplier.com`,
      address: `${suppliers.length + 100} Business Ave, Business City`,
      tax_id: `TX${suppliers.length}${suppliers.length}${suppliers.length}`,
      website: `www.supplier${suppliers.length + 1}.com`
    });
  }
  
  // Add timestamps
  const now = new Date();
  for (const supplier of suppliers) {
    supplier.created_at = now;
    supplier.updated_at = now;
    supplier.notes = 'Added during stress test generation';
  }
  
  // Insert suppliers
  await db('suppliers').insert(suppliers);
  return await db('suppliers').select('*');
}

// Generate products
async function generateProducts(db, categories, suppliers) {
  console.log('Generating products...');
  
  const units = ['pcs', 'kg', 'g', 'L', 'mL', 'box', 'pack', 'set', 'pair'];
  const productNames = [
    'Smartphone', 'Laptop', 'Tablet', 'Smart TV', 'Headphones', 'Speaker', 'Camera', 'Drone',
    'T-Shirt', 'Jeans', 'Jacket', 'Sneakers', 'Hoodie', 'Dress', 'Sweater', 'Boots',
    'Rice', 'Pasta', 'Bread', 'Milk', 'Eggs', 'Cheese', 'Coffee', 'Tea',
    'Chair', 'Table', 'Sofa', 'Bed', 'Dresser', 'Lamp', 'Rug', 'Shelf',
    'Shampoo', 'Conditioner', 'Toothpaste', 'Soap', 'Lotion', 'Perfume', 'Makeup', 'Face Cream',
    'Pen', 'Notebook', 'Stapler', 'Scissors', 'Paper', 'Folder', 'Clipboard', 'Marker',
    'Basketball', 'Soccer Ball', 'Tennis Racket', 'Golf Clubs', 'Yoga Mat', 'Dumbbell', 'Bicycle', 'Camping Tent',
    'Action Figure', 'Board Game', 'Puzzle', 'Lego Set', 'Doll', 'Remote Control Car', 'Card Game', 'Video Game',
    'Novel', 'Cookbook', 'Self-Help Book', 'Textbook', 'Magazine', 'Comic Book', 'Dictionary', 'Journal',
    'Multivitamin', 'Protein Powder', 'Fish Oil', 'Probiotics', 'Vitamin C', 'Medicine', 'First Aid Kit', 'Hand Sanitizer',
  ];
  
  const adjectives = [
    'Premium', 'Deluxe', 'Elite', 'Superior', 'Professional', 'Essential', 'Classic', 'Ultimate',
    'Basic', 'Advanced', 'Standard', 'Compact', 'Portable', 'Heavy-Duty', 'Lightweight', 'Organic',
    'Natural', 'Fresh', 'Handmade', 'Digital', 'Smart', 'Wireless', 'Rechargeable', 'Energy-Efficient',
    'Waterproof', 'All-Purpose', 'High-Performance', 'Budget', 'Modern', 'Traditional', 'Vintage', 'Eco-Friendly',
  ];
  
  const products = [];
  
  // Generate random products
  for (let i = 0; i < CONFIG.PRODUCTS_COUNT; i++) {
    const categoryId = randomItem(categories).id;
    const supplierId = randomItem(suppliers).id;
    const adjective = randomItem(adjectives);
    const productName = randomItem(productNames);
    const name = `${adjective} ${productName} ${randomBetween(100, 999)}`;
    
    // Generate barcode - ensure uniqueness
    const barcode = `P${i.toString().padStart(6, '0')}`;
    
    // Generate prices
    const costPrice = randomFloat(CONFIG.MIN_COST_PRICE, CONFIG.MAX_COST_PRICE);
    const markup = randomFloat(CONFIG.MARKUP_MIN, CONFIG.MARKUP_MAX);
    const sellingPrice = parseFloat((costPrice * (1 + markup)).toFixed(2));
    
    // Generate initial stock
    const initialStock = randomBetween(20, 200);
    
    products.push({
      name,
      barcode,
      category_id: categoryId,
      supplier_id: supplierId,
      selling_price: sellingPrice,
      cost_price: costPrice,
      stock_quantity: initialStock,
      min_stock_threshold: randomBetween(5, 20),
      unit: randomItem(units),
      description: `${adjective} quality ${productName.toLowerCase()} for all your needs.`,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  // Insert products in smaller batches to avoid SQLite limitations
  const batchSize = 50;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    await db('products').insert(batch);
  }
  
  return await db('products').select('*');
}

// Generate sales and sale items
async function generateSales(db, products) {
  console.log('Generating sales data...');
  
  const paymentMethods = ['cash', 'card', 'transfer', 'split'];
  const startDate = CONFIG.START_DATE;
  const endDate = CONFIG.END_DATE;
  const totalDays = differenceInDays(endDate, startDate);
  
  // Track total sales for console output
  let totalSalesGenerated = 0;
  
  // Loop through each day and generate sales
  for (let day = 0; day <= totalDays; day++) {
    const currentDate = addDays(startDate, day);
    const currentMonth = getMonth(currentDate); // 0-11
    const currentDayOfWeek = getDay(currentDate); // 0-6, where 0 is Sunday
    
    // Apply seasonality factors
    let dailySalesMultiplier = CONFIG.MONTHLY_SEASONALITY[currentMonth];
    
    // Weekend factor (Saturday and Sunday)
    if (currentDayOfWeek === 0 || currentDayOfWeek === 6) {
      dailySalesMultiplier *= CONFIG.WEEKEND_SALES_MULTIPLIER;
    }
    
    // Calculate number of sales for this day
    const numberOfSales = Math.floor(CONFIG.AVG_SALES_PER_DAY * dailySaljhjhesMultiplier);
    
    // Generate sales for the day
    for (let s = 0; s < numberOfSales; s++) {
      // Generate receipt number
      const receiptNumber = `S${format(currentDate, 'yyyyMMdd')}-${s.toString().padStart(4, '0')}`;
      
      // Generate a random time for this day
      const hour = randomBetween(8, 20); // 8 AM to 8 PM
      const minute = randomBetween(0, 59);
      const second = randomBetween(0, 59);
      
      const saleDate = new Date(currentDate);
      saleDate.setHours(hour, minute, second);
      
      // Select random products for this sale (1-5 items)
      const saleProducts = randomItems(products, 1, 5);
      
      // Calculate sale totals
      let subtotal = 0;
      const saleItems = [];
      
      for (const product of saleProducts) {
        const quantity = randomBetween(1, 3);
        const unitPrice = product.selling_price;
        
        // Random discount (0-10%)
        const discountPercent = Math.random() < 0.3 ? randomBetween(0, 10) : 0;
        const discountAmount = parseFloat(((unitPrice * quantity * discountPercent) / 100).toFixed(2));
        
        const totalPrice = parseFloat((unitPrice * quantity - discountAmount).toFixed(2));
        subtotal += totalPrice;
        
        saleItems.push({
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit_price: unitPrice,
          discount_amount: discountAmount,
          total_price: totalPrice,
          created_at: saleDate,
          updated_at: saleDate
        });
      }
      
      // Apply tax (random between 0-10%)
      const taxRate = randomBetween(0, 10) / 100;
      const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
      
      // Calculate final amounts
      const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));
      const paymentMethod = randomItem(paymentMethods);
      
      // For split payments
      let cardAmount = 0;
      let cashAmount = 0;
      let splitPaymentInfo = null;
      
      // Handle different payment methods
      if (paymentMethod === 'split') {
        // Split between cash and card
        cardAmount = parseFloat((totalAmount * randomFloat(0.3, 0.7)).toFixed(2));
        cashAmount = parseFloat((totalAmount - cardAmount).toFixed(2));
        
        splitPaymentInfo = JSON.stringify({
          methods: [
            { type: 'card', amount: cardAmount },
            { type: 'cash', amount: cashAmount }
          ]
        });
      } else if (paymentMethod === 'cash') {
        cashAmount = totalAmount;
      } else if (paymentMethod === 'card') {
        cardAmount = totalAmount;
      }
      
      // Amount paid is always at least the total amount
      const amountPaid = totalAmount;
      const changeAmount = paymentMethod === 'cash' ? randomBetween(0, 5) : 0;
      
      // Create the sale record
      const [saleId] = await db('sales').insert({
        receipt_number: receiptNumber,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: saleItems.reduce((sum, item) => sum + item.discount_amount, 0),
        total_amount: totalAmount,
        payment_method: paymentMethod,
        amount_paid: amountPaid + changeAmount,
        change_amount: changeAmount,
        cashier: 'Stress Test',
        is_returned: false,
        split_payment_info: splitPaymentInfo,
        card_amount: cardAmount,
        cash_amount: cashAmount,
        created_at: saleDate,
        updated_at: saleDate
      });
      
      // Add sale_id to each item
      for (const item of saleItems) {
        item.sale_id = saleId;
      }
      
      // Insert sale items
      await db('sale_items').insert(saleItems);
      
      // Update product stock quantities
      for (const item of saleItems) {
        await db('products')
          .where({ id: item.product_id })
          .decrement('stock_quantity', item.quantity);
        
        // Create stock adjustment record
        await db('stock_adjustments').insert({
          product_id: item.product_id,
          quantity_change: -item.quantity,
          adjustment_type: 'sale',
          reason: 'Sale transaction',
          reference: receiptNumber,
          created_at: saleDate,
          updated_at: saleDate
        });
      }
      
      totalSalesGenerated++;
    }
    
    // Generate some stock adjustments for this day
    if (day % 7 === 0) { // Once a week
      await generateStockAdjustments(db, products, currentDate);
    }
  }
  
  console.log(`Generated ${totalSalesGenerated} sales transactions over ${totalDays} days`);
}

// Generate stock adjustments (restocking, losses, corrections)
async function generateStockAdjustments(db, products, date) {
  const adjustmentTypes = ['purchase', 'loss', 'correction'];
  const reasons = {
    purchase: ['Restocking', 'Supplier delivery', 'Bulk order'],
    loss: ['Damaged goods', 'Expired products', 'Theft', 'Quality issues'],
    correction: ['Inventory count adjustment', 'System error correction', 'Data entry mistake']
  };
  
  // Select a subset of products for adjustments
  const productsToAdjust = randomItems(products, 5, 15);
  
  for (const product of productsToAdjust) {
    const adjustmentType = randomItem(adjustmentTypes);
    let quantityChange;
    
    if (adjustmentType === 'purchase') {
      // Restocking: add significant quantity
      quantityChange = randomBetween(10, 50);
    } else if (adjustmentType === 'loss') {
      // Loss: remove small quantity
      quantityChange = -randomBetween(1, 5);
    } else {
      // Correction: small adjustment in either direction
      quantityChange = randomBetween(-3, 3);
      if (quantityChange === 0) quantityChange = 1; // Avoid zero adjustments
    }
    
    // Reference number for the adjustment
    const reference = `ADJ-${format(date, 'yyyyMMdd')}-${product.id}`;
    
    // Create the adjustment record
    await db('stock_adjustments').insert({
      product_id: product.id,
      quantity_change: quantityChange,
      adjustment_type: adjustmentType,
      reason: randomItem(reasons[adjustmentType]),
      reference: reference,
      created_at: date,
      updated_at: date
    });
    
    // Update product stock
    await db('products')
      .where({ id: product.id })
      .increment('stock_quantity', quantityChange);
  }
}

// Main function to run the data generation
async function generateStressTestData() {
  let db = null;
  
  try {
    console.log('Starting stress test data generation...');
    console.log(`Time period: ${format(CONFIG.START_DATE, 'yyyy-MM-dd')} to ${format(CONFIG.END_DATE, 'yyyy-MM-dd')}`);
    
    // Get database connection
    db = await dbConnection.getConnection();
    
    // Clean existing data
    console.log('Cleaning existing data...');
    await db('sale_items').del();
    await db('sales').del();
    await db('stock_adjustments').del();
    await db('products').del();
    await db('categories').del();
    await db('suppliers').del();
    
    // Generate data
    const categories = await generateCategories(db);
    const suppliers = await generateSuppliers(db);
    const products = await generateProducts(db, categories, suppliers);
    await generateSales(db, products);
    
    console.log('Stress test data generation complete!');
    
    return { success: true };
  } catch (error) {
    console.error('Error generating stress test data:', error);
    return { success: false, error: error.message };
  }
}

// Run the data generation if this file is executed directly
if (require.main === module) {
  generateStressTestData()
    .then(result => {
      if (result.success) {
        console.log('✅ Stress test data generation completed successfully.');
      } else {
        console.error('❌ Stress test data generation failed:', result.error);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('❌ Unhandled error during stress test data generation:', err);
      process.exit(1);
    });
}

module.exports = { generateStressTestData }; 