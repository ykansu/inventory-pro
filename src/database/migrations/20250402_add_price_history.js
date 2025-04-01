/**
 * Add price history tracking functionality
 */
exports.up = function(knex) {
  return knex.schema
    // Add historical cost price to sale_items
    .alterTable('sale_items', table => {
      table.decimal('historical_cost_price', 10, 2).notNullable().after('unit_price');
    })

    // Create product price history table
    .createTable('product_price_history', table => {
      table.increments('id').primary();
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.decimal('selling_price', 10, 2).notNullable();
      table.decimal('cost_price', 10, 2).notNullable();
      table.string('change_type', 20).notNullable(); // 'selling_price', 'cost_price', 'both'
      table.text('reason');
      table.integer('changed_by_user_id').unsigned(); // Optional: track who made the change
      table.timestamps(true, true);
    })

    // Create triggers for price changes
    .raw(`
      CREATE TRIGGER after_product_price_update
      AFTER UPDATE ON products
      WHEN OLD.selling_price != NEW.selling_price OR OLD.cost_price != NEW.cost_price
      BEGIN
        INSERT INTO product_price_history (
          product_id,
          selling_price,
          cost_price,
          change_type,
          reason,
          created_at,
          updated_at
        )
        VALUES (
          NEW.id,
          NEW.selling_price,
          NEW.cost_price,
          CASE 
            WHEN OLD.selling_price != NEW.selling_price AND OLD.cost_price != NEW.cost_price THEN 'both'
            WHEN OLD.selling_price != NEW.selling_price THEN 'selling_price'
            ELSE 'cost_price'
          END,
          'Price update',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        );
      END;
    `)

    // Update existing sale_items with historical cost prices
    .raw(`
      UPDATE sale_items
      SET historical_cost_price = (
        SELECT cost_price 
        FROM products 
        WHERE products.id = sale_items.product_id
      )
      WHERE historical_cost_price = 0;
    `);
};

exports.down = function(knex) {
  return knex.schema
    .raw('DROP TRIGGER IF EXISTS after_product_price_update;')
    .dropTableIfExists('product_price_history')
    .alterTable('sale_items', table => {
      table.dropColumn('historical_cost_price');
    });
}; 