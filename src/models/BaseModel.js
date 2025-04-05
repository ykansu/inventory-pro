const dbManager = require('../database/dbManager');

// Base model with common CRUD operations
class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }
  
  // Get the database connection
  async getDb() {
    return dbManager.getConnection();
  }
  
  // Get all records
  async getAll() {
    const db = await this.getDb();
    return db(this.tableName).select('*');
  }
  
  // Get record by ID
  async getById(id) {
    const db = await this.getDb();
    return db(this.tableName).where({ id }).first();
  }
  
  // Create a new record
  async create(data) {
    const db = await this.getDb();
    const [id] = await db(this.tableName).insert(data);
    return this.getById(id);
  }
  
  // Update a record
  async update(id, data) {
    const db = await this.getDb();
    await db(this.tableName).where({ id }).update(data);
    return this.getById(id);
  }
  
  // Delete a record
  async delete(id) {
    const db = await this.getDb();
    return db(this.tableName).where({ id }).del();
  }
}

module.exports = BaseModel; 