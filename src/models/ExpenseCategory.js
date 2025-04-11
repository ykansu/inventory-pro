const BaseModel = require('./BaseModel');
const dbManager = require('../database/dbManager');

class ExpenseCategory extends BaseModel {
  constructor() {
    super('expense_categories');
  }
  
  // Get the database connection
  async getDb() {
    return dbManager.getConnection();
  }

  async getAll() {
    const db = await this.getDb();
    try {
      const categories = await db(this.tableName).select('*').orderBy('name');
      return { success: true, data: categories };
    } catch (error) {
      console.error('Error getting expense categories:', error);
      return { success: false, error: error.message };
    }
  }

  async getById(id) {
    const db = await this.getDb();
    try {
      const category = await db(this.tableName).where('id', id).first();
      if (!category) {
        return { success: false, error: 'Category not found' };
      }
      return { success: true, data: category };
    } catch (error) {
      console.error('Error getting expense category:', error);
      return { success: false, error: error.message };
    }
  }

  async create(data) {
    const db = await this.getDb();
    try {
      const [id] = await db(this.tableName).insert(data);
      const category = await db(this.tableName).where('id', id).first();
      return { success: true, data: category };
    } catch (error) {
      console.error('Error creating expense category:', error);
      return { success: false, error: error.message };
    }
  }

  async update(id, data) {
    const db = await this.getDb();
    try {
      await db(this.tableName).where('id', id).update(data);
      const category = await db(this.tableName).where('id', id).first();
      return { success: true, data: category };
    } catch (error) {
      console.error('Error updating expense category:', error);
      return { success: false, error: error.message };
    }
  }

  async delete(id) {
    const db = await this.getDb();
    try {
      // Check if category is in use
      const expenses = await db('expenses').where('category_id', id);
      if (expenses.length > 0) {
        return { success: false, error: 'Cannot delete category that is in use' };
      }
      
      await db(this.tableName).where('id', id).del();
      return { success: true };
    } catch (error) {
      console.error('Error deleting expense category:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get the count of expenses for each category
  async getCategoriesWithExpenseCount() {
    const db = await this.getDb();
    try {
      const categories = await db(this.tableName)
        .select(
          'expense_categories.*',
          db.raw('COUNT(expenses.id) as expense_count'),
          db.raw('SUM(expenses.amount) as total_amount')
        )
        .leftJoin('expenses', 'expense_categories.id', 'expenses.category_id')
        .groupBy('expense_categories.id')
        .orderBy('expense_categories.name');
        
      return { success: true, data: categories };
    } catch (error) {
      console.error('Error getting expense categories with count:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ExpenseCategory; 