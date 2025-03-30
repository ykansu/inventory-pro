// Simple script to run migrations from the command line
const path = require('path');
const knex = require('knex');
const fs = require('fs');
const knexfile = require('./knexfile');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create knex instance
const db = knex(knexfile);

// Run migrations
async function runMigrations() {
  try {
    console.log('Running migrations...');
    const [batchNo, log] = await db.migrate.latest();
    
    if (log.length === 0) {
      console.log('Already up to date');
    } else {
      console.log(`Batch ${batchNo} run: ${log.length} migrations`);
      console.log(`${log.join('\n')}`);
    }
    
    // Run seeds if this is a new database
    const [{ count }] = await db('sqlite_master')
      .count('* as count')
      .where('type', 'table')
      .whereNot('name', 'like', 'sqlite_%');
    
    if (count <= 2) {
      console.log('Running seeds...');
      await db.seed.run();
      console.log('Seeding completed successfully');
    }
    
    console.log('All done!');
  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    // Close the database connection
    await db.destroy();
  }
}

// Run the migrations
runMigrations();