const BaseModel = require('./BaseModel');
const dbManager = require('../database/dbManager');
const fs = require('fs').promises;
const path = require('path');

class Expense extends BaseModel {
  constructor() {
    super('expenses');
  }
  
  // Get the database connection
  async getDb() {
    return dbManager.getConnection();
  }

  async getAll(filters = {}) {
    const db = await this.getDb();
    let query = db(this.tableName)
      .select('expenses.*', 'expense_categories.name as category_name')
      .leftJoin('expense_categories', 'expenses.category_id', 'expense_categories.id');

    if (filters.startDate && filters.endDate) {
      query = query.whereBetween('expenses.expense_date', [filters.startDate, filters.endDate]);
    }

    if (filters.categoryId) {
      query = query.where('expenses.category_id', filters.categoryId);
    }

    if (filters.paymentMethod) {
      query = query.where('expenses.payment_method', filters.paymentMethod);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.where(function() {
        this.where('expenses.description', 'like', searchTerm)
          .orWhere('expenses.reference_number', 'like', searchTerm)
          .orWhere('expenses.recipient', 'like', searchTerm)
          .orWhere('expenses.notes', 'like', searchTerm)
          .orWhere('expense_categories.name', 'like', searchTerm);
      });
    }
    
    const expenses = await query.orderBy('expenses.expense_date', 'desc');
    return { success: true, data: expenses };
  }

  async getById(id) {
    const db = await this.getDb();
    const expense = await db(this.tableName)
      .select('expenses.*', 'expense_categories.name as category_name')
      .leftJoin('expense_categories', 'expenses.category_id', 'expense_categories.id')
      .where('expenses.id', id)
      .first();
      
    if (!expense) {
      return { success: false, error: 'Expense not found' };
    }
    
    return { success: true, data: expense };
  }

  async create(data) {
    const db = await this.getDb();
    try {
      const [id] = await db(this.tableName).insert(data);
      const expense = await db(this.tableName)
        .select('expenses.*', 'expense_categories.name as category_name')
        .leftJoin('expense_categories', 'expenses.category_id', 'expense_categories.id')
        .where('expenses.id', id)
        .first();
      return { success: true, data: expense };
    } catch (error) {
      console.error('Error creating expense:', error);
      return { success: false, error: error.message };
    }
  }

  async update(id, data) {
    const db = await this.getDb();
    try {
      await db(this.tableName).where('id', id).update(data);
      const expense = await db(this.tableName)
        .select('expenses.*', 'expense_categories.name as category_name')
        .leftJoin('expense_categories', 'expenses.category_id', 'expense_categories.id')
        .where('expenses.id', id)
        .first();
      return { success: true, data: expense };
    } catch (error) {
      console.error('Error updating expense:', error);
      return { success: false, error: error.message };
    }
  }

  async delete(id) {
    const db = await this.getDb();
    try {
      const expense = await db(this.tableName).where('id', id).first();
      
      if (!expense) {
        return { success: false, error: 'Expense not found' };
      }
      
      // Delete receipt image if exists
      if (expense.receipt_image_path) {
        try {
          const receiptPath = path.join(__dirname, '..', '..', 'uploads', 'receipts', expense.receipt_image_path);
          await fs.unlink(receiptPath);
        } catch (error) {
          console.error('Error deleting receipt file:', error);
        }
      }
      
      await db(this.tableName).where('id', id).del();
      return { success: true };
    } catch (error) {
      console.error('Error deleting expense:', error);
      return { success: false, error: error.message };
    }
  }

  // Get expenses for a specific month
  async getMonthlyExpenses(year, month) {
    const db = await this.getDb();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const expenses = await db(this.tableName)
      .whereBetween('expense_date', [startDate, endDate])
      .sum('amount as total');
      
    return expenses[0].total || 0;
  }

  // Get expenses by category
  async getExpensesByCategory(startDate = null, endDate = null) {
    const db = await this.getDb();
    let query = db(this.tableName)
      .select('expense_categories.name as category')
      .sum('expenses.amount as total')
      .leftJoin('expense_categories', 'expenses.category_id', 'expense_categories.id')
      .groupBy('expense_categories.name');
      
    if (startDate && endDate) {
      query = query.whereBetween('expenses.expense_date', [startDate, endDate]);
    }
    
    const results = await query;
    return { success: true, data: results };
  }
}

module.exports = Expense; 