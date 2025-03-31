/**
 * Migration: Add split payment support
 * 
 * This migration adds a field to track split payment methods
 */
exports.up = function(knex) {
  return knex.schema
    .table('sales', function(table) {
      // Add column for split payment info (JSON string)
      table.text('split_payment_info').nullable();
      // Add column for payment method details
      table.text('payment_method_details').nullable();
    });
};

exports.down = function(knex) {
  return knex.schema
    .table('sales', function(table) {
      table.dropColumn('split_payment_info');
      table.dropColumn('payment_method_details');
    });
}; 