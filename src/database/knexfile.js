const path = require('path');
const fs = require('fs');
const config = require('./config');

// Get database path from environment configuration
const dbPath = config.dbPath;

// Ensure the database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Determine if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Production DB config
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
  },
  // Adjust SQLite pool settings
  pool: {
    min: 2,
    max: 10,
    // Handle SQLite SQLITE_BUSY errors by waiting and retrying
    acquireTimeoutMillis: 10000,
    createTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
    afterCreate: (conn, done) => {
      // Enable foreign keys
      conn.run('PRAGMA foreign_keys = ON', done);
    },
  },
  // Adjust logging based on environment
  log: {
    warn(message) {
      if (!isProduction) {
        console.warn(message);
      }
    },
    error(message) {
      console.error(message);
    },
    deprecate(message) {
      if (!isProduction) {
        console.warn(message);
      }
    },
    debug(message) {
      if (!isProduction) {
        console.debug(message);
      }
    },
  },
};