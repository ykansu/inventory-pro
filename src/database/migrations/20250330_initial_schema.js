/**
 * Initial database schema for Inventory Pro
 */
exports.up = function(knex) {
    return knex.schema
      // Categories table
      .createTable('categories', table => {
        table.increments('id').primary();
        table.string('name', 50).notNullable().unique();
        table.string('description', 255);
        table.timestamps(true, true);
      })
      
      // Suppliers table
      .createTable('suppliers', table => {
        table.increments('id').primary();
        table.string('company_name', 100).notNullable().unique();
        table.string('contact_person', 100).notNullable();
        table.string('phone', 20).notNullable();
        table.string('email', 100);
        table.text('address');
        table.string('tax_id', 50);
        table.string('website', 255);
        table.text('notes');
        table.timestamps(true, true);
      })
      
      // Products table
      .createTable('products', table => {
        table.increments('id').primary();
        table.string('name', 100).notNullable();
        table.string('barcode', 50).unique();
        table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('SET NULL');
        table.decimal('selling_price', 10, 2).notNullable();
        table.decimal('cost_price', 10, 2).notNullable();
        table.integer('stock_quantity').notNullable().defaultTo(0);
        table.integer('min_stock_threshold').notNullable().defaultTo(5);
        table.string('unit', 20).notNullable().defaultTo('pcs');
        table.integer('supplier_id').unsigned().references('id').inTable('suppliers').onDelete('SET NULL');
        table.text('description');
        table.string('image_path', 255);
        table.timestamps(true, true);
        
        // Add unique constraint on name to prevent duplicates
        table.unique('name');
      })
      
      // Sales table (transactions)
      .createTable('sales', table => {
        table.increments('id').primary();
        table.string('receipt_number', 50).notNullable().unique();
        table.decimal('subtotal', 10, 2).notNullable();
        table.decimal('tax_amount', 10, 2).notNullable().defaultTo(0);
        table.decimal('discount_amount', 10, 2).notNullable().defaultTo(0);
        table.decimal('total_amount', 10, 2).notNullable();
        table.string('payment_method', 20).notNullable().defaultTo('cash');
        table.decimal('amount_paid', 10, 2).notNullable();
        table.decimal('change_amount', 10, 2).notNullable().defaultTo(0);
        table.string('cashier', 100);
        table.boolean('is_returned').notNullable().defaultTo(false);
        table.text('notes');
        table.timestamps(true, true);
      })
      
      // Sale items (line items in transactions)
      .createTable('sale_items', table => {
        table.increments('id').primary();
        table.integer('sale_id').unsigned().notNullable().references('id').inTable('sales').onDelete('CASCADE');
        table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('RESTRICT');
        table.string('product_name', 100).notNullable();
        table.integer('quantity').notNullable();
        table.decimal('unit_price', 10, 2).notNullable();
        table.decimal('discount_amount', 10, 2).notNullable().defaultTo(0);
        table.decimal('total_price', 10, 2).notNullable();
        table.timestamps(true, true);
      })
      
      // Stock adjustments
      .createTable('stock_adjustments', table => {
        table.increments('id').primary();
        table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
        table.integer('quantity_change').notNullable();
        table.string('adjustment_type', 20).notNullable(); // 'purchase', 'sale', 'return', 'loss', 'correction'
        table.text('reason');
        table.string('reference', 100); // Reference to related document (e.g., receipt number)
        table.timestamps(true, true);
      })
      
      // Settings table
      .createTable('settings', table => {
        table.string('key', 50).primary();
        table.text('value');
        table.string('type', 20).notNullable().defaultTo('string'); // string, number, boolean, json
        table.string('description', 255);
        table.timestamps(true, true);
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTableIfExists('sale_items')
      .dropTableIfExists('sales')
      .dropTableIfExists('stock_adjustments')
      .dropTableIfExists('products')
      .dropTableIfExists('suppliers')
      .dropTableIfExists('categories')
      .dropTableIfExists('settings');
  };