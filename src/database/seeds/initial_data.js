/**
 * Initial seed data for Inventory Pro
 */
exports.seed = async function(knex) {
  // Clear existing data
  await knex('sale_items').del();
  await knex('sales').del();
  await knex('stock_adjustments').del();
  await knex('products').del();
  await knex('suppliers').del();
  await knex('categories').del();
  await knex('settings').del();
  
  // Insert default settings
  await knex('settings').insert([
    {
      key: 'business_name',
      value: 'Inventory Pro Store',
      type: 'string',
      description: 'Name of the business'
    },
    {
      key: 'business_address',
      value: 'Istanbul, Turkey',
      type: 'string',
      description: 'Address of the business'
    },
    {
      key: 'business_phone',
      value: '+90 123 456 7890',
      type: 'string',
      description: 'Phone number of the business'
    },
    {
      key: 'business_email',
      value: 'contact@inventorypro.com',
      type: 'string',
      description: 'Email of the business'
    },
    {
      key: 'currency',
      value: 'TRY',
      type: 'string',
      description: 'Currency used in the application'
    },
    {
      key: 'tax_rate',
      value: '18',
      type: 'number',
      description: 'Default tax rate percentage'
    },
    {
      key: 'receipt_footer',
      value: 'Thank you for your purchase!',
      type: 'string',
      description: 'Message to display at the bottom of receipts'
    },
    {
      key: 'date_format',
      value: 'DD/MM/YYYY',
      type: 'string',
      description: 'Format for displaying dates'
    },
    {
      key: 'time_format',
      value: '24',
      type: 'string',
      description: 'Format for displaying time (12 or 24)'
    }
  ]);
  
  // Insert default categories
  await knex('categories').insert([
    {
      id: 1,
      name: 'General',
      description: 'General products category'
    },
    {
      id: 2,
      name: 'Electronics',
      description: 'Electronic devices and accessories'
    },
    {
      id: 3,
      name: 'Clothing',
      description: 'Apparel and fashion items'
    },
    {
      id: 4,
      name: 'Food & Beverages',
      description: 'Consumable food and drink items'
    },
    {
      id: 5,
      name: 'Stationery',
      description: 'Office and school supplies'
    }
  ]);

  // Insert default suppliers
  await knex('suppliers').insert([
    {
      id: 1,
      company_name: 'TechSupply Co.',
      contact_person: 'Ahmet Yılmaz',
      phone: '+90 555 123 4567',
      email: 'info@techsupply.com',
      address: 'Kadıköy, Istanbul',
      tax_id: '1234567890',
      website: 'www.techsupply.com',
      notes: 'Reliable electronics supplier'
    },
    {
      id: 2,
      company_name: 'General Goods Ltd.',
      contact_person: 'Ayşe Kaya',
      phone: '+90 555 987 6543',
      email: 'contact@generalgoods.com',
      address: 'Beşiktaş, Istanbul',
      tax_id: '0987654321',
      website: 'www.generalgoods.com',
      notes: 'Supplies various general merchandise'
    }
  ]);

  // Insert sample products
  await knex('products').insert([
    {
      name: 'Laptop Pro X1',
      barcode: '8901234567890',
      category_id: 2, // Electronics
      selling_price: 12999.99,
      cost_price: 10500.00,
      stock_quantity: 15,
      min_stock_threshold: 5,
      unit: 'pcs',
      supplier_id: 1, // TechSupply Co.
      description: 'High-performance laptop with 16GB RAM, 512GB SSD',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Wireless Mouse',
      barcode: '8901234567891',
      category_id: 2, // Electronics
      selling_price: 299.99,
      cost_price: 150.00,
      stock_quantity: 30,
      min_stock_threshold: 10,
      unit: 'pcs',
      supplier_id: 1, // TechSupply Co.
      description: 'Ergonomic wireless mouse with long battery life',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Cotton T-Shirt',
      barcode: '8901234567892',
      category_id: 3, // Clothing
      selling_price: 149.99,
      cost_price: 75.00,
      stock_quantity: 50,
      min_stock_threshold: 15,
      unit: 'pcs',
      supplier_id: 2, // General Goods Ltd.
      description: 'Comfortable cotton t-shirt, available in multiple colors',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Organic Coffee Beans',
      barcode: '8901234567893',
      category_id: 4, // Food & Beverages
      selling_price: 89.99,
      cost_price: 45.00,
      stock_quantity: 25,
      min_stock_threshold: 8,
      unit: 'kg',
      supplier_id: 2, // General Goods Ltd.
      description: 'Premium organic coffee beans, medium roast',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Notebook Set',
      barcode: '8901234567894',
      category_id: 5, // Stationery
      selling_price: 49.99,
      cost_price: 25.00,
      stock_quantity: 100,
      min_stock_threshold: 20,
      unit: 'pcs',
      supplier_id: 2, // General Goods Ltd.
      description: 'Set of 3 premium notebooks with different page styles',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Wireless Headphones',
      barcode: '8901234567895',
      category_id: 2, // Electronics
      selling_price: 799.99,
      cost_price: 450.00,
      stock_quantity: 20,
      min_stock_threshold: 5,
      unit: 'pcs',
      supplier_id: 1, // TechSupply Co.
      description: 'Noise-cancelling wireless headphones with 30-hour battery life',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Desk Lamp',
      barcode: '8901234567896',
      category_id: 1, // General
      selling_price: 199.99,
      cost_price: 100.00,
      stock_quantity: 35,
      min_stock_threshold: 10,
      unit: 'pcs',
      supplier_id: 2, // General Goods Ltd.
      description: 'Adjustable LED desk lamp with multiple brightness levels',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Mineral Water (6-pack)',
      barcode: '8901234567897',
      category_id: 4, // Food & Beverages
      selling_price: 19.99,
      cost_price: 10.00,
      stock_quantity: 60,
      min_stock_threshold: 20,
      unit: 'pcs',
      supplier_id: 2, // General Goods Ltd.
      description: 'Pack of 6 natural mineral water bottles, 1L each',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};