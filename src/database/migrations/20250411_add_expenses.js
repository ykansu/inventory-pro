/**
 * Add expenses tracking functionality
 */
exports.up = function(knex) {
  return knex.schema
    // Create expense categories table
    .createTable('expense_categories', table => {
      table.increments('id').primary();
      table.string('name', 50).notNullable().unique();
      table.string('description', 255);
      table.timestamps(true, true);
    })
    
    // Create expenses table
    .createTable('expenses', table => {
      table.increments('id').primary();
      table.string('reference_number', 50);
      table.string('description', 255);
      table.decimal('amount', 10, 2).notNullable();
      table.integer('category_id').unsigned().references('id').inTable('expense_categories').onDelete('SET NULL');
      table.date('expense_date').notNullable();
      table.string('payment_method', 20).notNullable().defaultTo('cash');
      table.string('recipient', 100);
      table.text('notes');
      table.string('receipt_image_path', 255);
      table.timestamps(true, true);
    })
    
    // Add some default expense categories
    .then(() => {
      return knex('expense_categories').insert([
        { name: 'Rent', description: 'Office/Store rent expenses' },
        { name: 'Utilities', description: 'Electricity, water, internet, etc.' },
        { name: 'Salaries', description: 'Employee salaries and wages' },
        { name: 'Supplies', description: 'Office supplies and materials' },
        { name: 'Marketing', description: 'Advertising and promotional expenses' },
        { name: 'Maintenance', description: 'Building/equipment maintenance' },
        { name: 'Other', description: 'Miscellaneous expenses' }
      ]);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('expenses')
    .dropTableIfExists('expense_categories');
}; 