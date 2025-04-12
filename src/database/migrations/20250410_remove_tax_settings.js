/**
 * Migration: Remove tax settings
 * 
 * This migration removes tax-related settings from the settings table
 * while preserving the tax_id field which is used for business identification.
 */
exports.up = function(knex) {
  return Promise.all([
    // Remove tax settings one by one
    knex('settings').where('key', 'enable_tax').delete(),
    knex('settings').where('key', 'tax_rate').delete(),
    knex('settings').where('key', 'tax_name').delete(),
    knex('settings').where('key', 'show_tax_details').delete()
  ])
  .then(() => {
    console.log('Migration: Removed tax-related settings from the settings table');
    return Promise.resolve();
  });
};

exports.down = function(knex) {
  // Tax settings are no longer needed
  console.log('Migration rollback: Tax settings will not be restored');
  return Promise.resolve();
}; 