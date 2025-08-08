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
  
  // Delete a record (soft delete for products, hard delete for others)
  async delete(id) {
    const db = await this.getDb();
    
    // For products table, use soft delete
    if (this.tableName === 'products') {
      return db(this.tableName)
        .where({ id })
        .where('is_deleted', false) // Ensure we're not deleting an already deleted product
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
    
    // For other tables, use hard delete
    return db(this.tableName).where({ id }).del();
  }
  
  // Hard delete a record (for maintenance)
  async hardDelete(id) {
    const db = await this.getDb();
    return db(this.tableName).where({ id }).del();
  }
  
  // Restore a soft deleted record (for products)
  async restore(id) {
    const db = await this.getDb();
    
    // Only applicable for products table
    if (this.tableName === 'products') {
      return db(this.tableName)
        .where({ id })
        .where('is_deleted', true) // Ensure we're only restoring a deleted product
        .update({ 
          is_deleted: false,
          deleted_at: null,
          updated_at: new Date().toISOString()
        });
    }
    
    // For other tables, this operation is not supported
    throw new Error(`Restore operation not supported for table: ${this.tableName}`);
  }
}

module.exports = BaseModel; 