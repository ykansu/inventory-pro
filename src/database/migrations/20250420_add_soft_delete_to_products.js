exports.up = function(knex) {
  return knex.schema.alterTable('products', table => {
    // Add soft delete fields
    table.boolean('is_deleted').notNullable().defaultTo(false);
    table.datetime('deleted_at').nullable();
    
    // Add index for performance
    table.index('is_deleted', 'products_is_deleted_idx');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('products', table => {
    table.dropIndex('is_deleted', 'products_is_deleted_idx');
    table.dropColumn('is_deleted');
    table.dropColumn('deleted_at');
  });
};