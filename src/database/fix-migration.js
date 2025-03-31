/**
 * Database Migration Fixer Utility
 * 
 * This utility fixes issues with the migration history by removing problematic
 * migration records from the knex_migrations table.
 */

const knex = require('knex');
const config = require('./config');
const knexConfig = require('./knexfile');

async function fixMigrations() {
  console.log('Starting migration fix utility...');
  console.log('Database path:', config.dbPath);
  
  // Create a new database connection
  const db = knex(knexConfig);
  
  try {
    // Check if we have the knex_migrations table
    const hasMigrationsTable = await db.schema.hasTable('knex_migrations');
    
    if (!hasMigrationsTable) {
      console.log('No knex_migrations table found. No fixes needed.');
      await db.destroy();
      return;
    }
    
    // Get all migrations
    const migrations = await db('knex_migrations').select('*');
    console.log('Current migrations:', migrations.map(m => m.name));
    
    // Find problematic migration (20231225_add_split_payment.js)
    const problematicMigration = migrations.find(m => 
      m.name.includes('20231225_add_split_payment.js')
    );
    
    if (problematicMigration) {
      console.log('Found problematic migration:', problematicMigration);
      
      // Remove the problematic migration record
      await db('knex_migrations')
        .where('id', problematicMigration.id)
        .del();
      
      console.log('Removed problematic migration record');
    } else {
      console.log('No problematic migrations found.');
    }
    
    // Close the database connection
    await db.destroy();
    console.log('Migration fix completed.');
  } catch (error) {
    console.error('Error fixing migrations:', error);
    await db.destroy();
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixMigrations()
    .then(() => {
      console.log('Migration fix utility completed successfully.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration fix utility failed:', err);
      process.exit(1);
    });
}

module.exports = { fixMigrations }; 