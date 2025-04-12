   // In a new migration file:
   exports.up = function(knex) {
    return knex.schema
      .alterTable('sales', table => {
        table.index('created_at', 'sales_created_at_idx');
      })
      .alterTable('sales', table => {
        table.index(['created_at', 'is_returned'], 'sales_created_at_returned_idx');
      })
      .alterTable('sale_items', table => {
        table.index('sale_id', 'sale_items_sale_id_idx');
      })
      .alterTable('products', table => {
        table.index('category_id', 'products_category_id_idx');
      })
      .alterTable('products', table => {
        table.index('supplier_id', 'products_supplier_id_idx');
      })
      .alterTable('products', table => {
        table.index('barcode', 'products_barcode_idx');
      });
  };

  exports.down = function(knex) {
    return knex.schema
    .alterTable('sales', table => {
        table.dropIndex('created_at', 'sales_created_at_idx');
      })
      .alterTable('sales', table => {
        table.dropIndex(['created_at', 'is_returned'], 'sales_created_at_returned_idx');
      })
      .alterTable('sale_items', table => {
        table.dropIndex('sale_id', 'sale_items_sale_id_idx');
      })
      .alterTable('products', table => {
        table.dropIndex('category_id', 'products_category_id_idx');
      })
      .alterTable('products', table => {
        table.dropIndex('supplier_id', 'products_supplier_id_idx');
      })
      .alterTable('products', table => {
        table.dropIndex('barcode', 'products_barcode_idx');
      });

      
  }; 