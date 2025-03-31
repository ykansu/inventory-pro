/**
 * Migration: Add split payment support
 * 
 * This migration adds a field to track split payment methods
 */
exports.up = function(knex) {
  return knex.schema
    .hasColumn('sales', 'split_payment_info')
    .then(function(exists) {
      if (!exists) {
        return knex.schema.table('sales', function(table) {
          // Add column for split payment info (JSON string)
          table.text('split_payment_info').nullable();
        });
      }
    })
    .then(() => {
      return knex.schema.hasColumn('sales', 'payment_method_details');
    })
    .then(function(exists) {
      if (!exists) {
        return knex.schema.table('sales', function(table) {
          // Add column for payment method details
          table.text('payment_method_details').nullable();
        });
      }
    });
};

exports.down = function(knex) {
  return knex.schema
    .hasColumn('sales', 'split_payment_info')
    .then(function(exists) {
      if (exists) {
        return knex.schema.table('sales', function(table) {
          table.dropColumn('split_payment_info');
        });
      }
    })
    .then(() => {
      return knex.schema.hasColumn('sales', 'payment_method_details');
    })
    .then(function(exists) {
      if (exists) {
        return knex.schema.table('sales', function(table) {
          table.dropColumn('payment_method_details');
        });
      }
    });
}; 