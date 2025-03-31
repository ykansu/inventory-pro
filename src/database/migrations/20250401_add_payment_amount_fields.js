/**
 * Migration: Add payment amount fields
 * 
 * This migration adds fields to track card_amount and cash_amount 
 * in the sales table for better payment tracking
 */
exports.up = function(knex) {
  return knex.schema
    .hasColumn('sales', 'card_amount')
    .then(function(exists) {
      if (!exists) {
        return knex.schema.table('sales', function(table) {
          // Add column for card payment amount
          table.decimal('card_amount', 10, 2).defaultTo(0);
        });
      }
    })
    .then(() => {
      return knex.schema.hasColumn('sales', 'cash_amount');
    })
    .then(function(exists) {
      if (!exists) {
        return knex.schema.table('sales', function(table) {
          // Add column for cash payment amount
          table.decimal('cash_amount', 10, 2).defaultTo(0);
        });
      }
    })
    .then(() => {
      // Log that migration completed successfully
      console.log('Migration: Added card_amount and cash_amount fields to sales table');
      return Promise.resolve();
    });
};

exports.down = function(knex) {
  return knex.schema
    .hasColumn('sales', 'card_amount')
    .then(function(exists) {
      if (exists) {
        return knex.schema.table('sales', function(table) {
          table.dropColumn('card_amount');
        });
      }
    })
    .then(() => {
      return knex.schema.hasColumn('sales', 'cash_amount');
    })
    .then(function(exists) {
      if (exists) {
        return knex.schema.table('sales', function(table) {
          table.dropColumn('cash_amount');
        });
      }
    });
}; 