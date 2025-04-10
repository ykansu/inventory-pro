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
  // Recreate the default tax settings if needed
  return Promise.all([
    knex('settings').insert({
      key: 'enable_tax',
      value: 'false',
      type: 'boolean',
      description: 'Enable tax calculation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    knex('settings').insert({
      key: 'tax_rate',
      value: '0',
      type: 'number',
      description: 'Default tax rate percentage',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    knex('settings').insert({
      key: 'tax_name',
      value: 'Tax',
      type: 'string',
      description: 'Tax name',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    knex('settings').insert({
      key: 'show_tax_details',
      value: 'true',
      type: 'boolean',
      description: 'Show tax details on receipts',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  ]);
}; 