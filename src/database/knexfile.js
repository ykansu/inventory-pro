const path = require('path');
const fs = require('fs');
const config = require('./config');

// Determine if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Ensure the database directory exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

module.exports = {
  client: 'sqlite3',
  connection: {
    filename: config.dbPath,
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
    afterCreate: (conn, cb) => {
      // Enable foreign keys support
      conn.run('PRAGMA foreign_keys = ON', cb);
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