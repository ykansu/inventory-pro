/**
 * Force Seed Database Utility
 * 
 * This is a development/admin utility to force re-seed the database.
 * It can be used to reset the database to its initial state or to
 * troubleshoot database issues.
 * 
 * CAUTION: This will delete all existing data in the database!
 */

const db = require('./connection');
const path = require('path');
const fs = require('fs');
const config = require('./config');

/**
 * Force re-seed the database by clearing all data and running seeds
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function forceSeedDatabase() {
  try {
    console.log('Starting force seed of database...');
    console.log('Database path:', config.dbPath);
    
    // Verify database connection
    await db.raw('SELECT 1');
    console.log('Database connection verified');
    
    // Start transaction
    await db.transaction(async trx => {
      // Clear existing data
      console.log('Clearing existing data...');
      await trx('sale_items').del();
      await trx('sales').del();
      await trx('stock_adjustments').del();
      await trx('products').del();
      await trx('suppliers').del();
      await trx('categories').del();
      await trx('settings').del();
      
      // Run seeds
      console.log('Running seeds...');
      await require('./seeds/initial_data').seed(trx);
      
      console.log('Database re-seeded successfully');
    });
    
    // Verify seeding
    const productCount = await db('products').count('* as count').first();
    console.log(`Verified ${productCount.count} products in database after seeding`);
    
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

module.exports = { forceSeedDatabase };
