/**
 * Force Seed Database Utility
 * 
 * This is a development/admin utility to force re-seed the database.
 * It can be used to reset the database to its initial state or to
 * troubleshoot database issues.
 * 
 * CAUTION: This will delete all existing data in the database!
 */

const knex = require('knex');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const dbConnection = require('./connection');

/**
 * Remove any problematic migration records
 */
const cleanMigrationRecords = async (database) => {
  try {
    // Check if knex_migrations table exists
    const hasMigrationsTable = await database.schema.hasTable('knex_migrations');
    if (!hasMigrationsTable) {
      console.log('No migrations table found, skipping migration cleanup');
      return;
    }
    
    // Find and remove any problematic migration records
    const problematicMigration = await database('knex_migrations')
      .where('name', 'like', '%20231225_add_split_payment.js%')
      .first();
    
    if (problematicMigration) {
      console.log('Found problematic migration record:', problematicMigration.name);
      await database('knex_migrations')
        .where('id', problematicMigration.id)
        .del();
      console.log('Removed problematic migration record');
    }
  } catch (error) {
    console.error('Error cleaning migration records:', error);
    // Continue even if this fails
  }
};

/**
 * Force seed the database with initial data.
 * This will delete all existing data and repopulate with seed data.
 */
async function forceSeedDatabase(options = { skipSeeding: false }) {
  try {
    console.log('Starting force seed operation...');
    
    // Get database connection
    let db;
    try {
      db = await dbConnection.getConnection();
      console.log('Database connection verified');
    } catch (connError) {
      console.error('Database connection failed:', connError);
      return false;
    }
    
    // First, try to clean up any problematic migration records
    await cleanMigrationRecords(db);
    
    // Delete all existing data in the correct order (respecting foreign key constraints)
    try {
      console.log('Deleting existing data...');
      
      // Disable foreign key checks (for SQLite)
      await db.raw('PRAGMA foreign_keys = OFF;');
      
      // Clear tables in reverse dependency order to avoid constraint issues
      await db('sale_items').truncate();
      console.log('  - Truncated sale_items table');
      
      await db('sales').truncate();
      console.log('  - Truncated sales table');
      
      await db('stock_adjustments').truncate();
      console.log('  - Truncated stock_adjustments table');
      
      await db('products').truncate();
      console.log('  - Truncated products table');
      
      await db('suppliers').truncate();
      console.log('  - Truncated suppliers table');
      
      await db('categories').truncate();
      console.log('  - Truncated categories table');
      
      // Only keep essential settings
      const settingsToKeep = [
        'language',
        'currency',
        'date_format',
        'business_name',
        'business_address',
        'business_phone',
        'business_email'
      ];
      
      // Delete settings that we don't want to keep
      await db('settings')
        .whereNotIn('key', settingsToKeep)
        .del();
      console.log('  - Cleaned settings table (keeping essential settings)');
      
      // Re-enable foreign key checks
      await db.raw('PRAGMA foreign_keys = ON;');
      
      console.log('All existing data cleared successfully.');
    } catch (deleteError) {
      console.error('Error deleting existing data:', deleteError);
      // Try to re-enable foreign keys even if delete failed
      try {
        await db.raw('PRAGMA foreign_keys = ON;');
      } catch (e) {
        // Ignore error when trying to re-enable foreign keys
      }
      throw deleteError;
    }
    
    // Run seed data (import from seed file) only if skipSeeding is false
    if (!options.skipSeeding) {
      try {
        const seedPath = path.join(__dirname, 'seeds', 'initial_data.js');
        
        if (fs.existsSync(seedPath)) {
          console.log('Running seed file...');
          const { seed } = require('./seeds/initial_data.js');
          await seed(db);
          console.log('Seed data imported successfully.');
        } else {
          console.warn('No seed file found at:', seedPath);
        }
      } catch (seedError) {
        console.error('Error during seeding:', seedError);
        throw seedError;
      }
    } else {
      console.log('Seeding is disabled. Skipping seed script.');
    }
    
    console.log('Force seed operation completed successfully.');
    return true;
  } catch (error) {
    console.error('Force seed failed:', error);
    return false;
  }
}

/**
 * Export a command-line interface for this utility
 */
if (require.main === module) {
  // This file was run directly from the command line
  forceSeedDatabase()
    .then(success => {
      if (success) {
        console.log('Database force seed completed successfully');
        process.exit(0);
      } else {
        console.error('Database force seed failed');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unhandled error during force seed:', err);
      process.exit(1);
    });
}

module.exports = {
  forceSeedDatabase
};
