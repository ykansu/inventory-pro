const BaseModel = require('./BaseModel');
const dbManager = require('../database/dbManager');
const fs = require('fs').promises;
const path = require('path');
const { startOfMonth, endOfMonth, subMonths } = require('date-fns');
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
  async getMonthlyExpenses() {
    const db = await this.getDb();
    const now = new Date();
    const startDate = startOfMonth(now).toISOString();
    const endDate = endOfMonth(now).toISOString();
    
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

  // Add a new method to get expenses trend data from the database directly
  async getExpensesTrend(months = 6) {
    const db = await this.getDb();
    
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = startOfMonth(subMonths(endDate, months - 1));
      
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // SQL query to get monthly expense totals
      const result = await db.raw(`
        SELECT 
          strftime('%Y', expense_date, 'localtime') as year,
          strftime('%m', expense_date, 'localtime') as month,
          SUM(amount) as total_amount
        FROM expenses
        WHERE expense_date BETWEEN ? AND ?
        GROUP BY strftime('%Y', expense_date, 'localtime'), strftime('%m', expense_date, 'localtime')
        ORDER BY year ASC, month ASC
      `, [formattedStartDate, formattedEndDate]);
      
      // Get results from the query (handle different DB drivers)
      const rows = result && result.length ? result : result && result.rows ? result.rows : [];
      
      // Create a map for all the months in the range
      const monthlyData = {};
      
      // Initialize all months with zero values
      for (let i = 0; i < months; i++) {
        const date = subMonths(new Date(), i);
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12 format
        // Format properly for map key
        const paddedMonth = month.toString().padStart(2, '0');
        const monthKey = `${year}-${paddedMonth}`;
        
        // Month name (short)
        const monthName = date.toLocaleString('default', { month: 'short' });
        
        monthlyData[monthKey] = {
          name: `${monthName} ${year}`,
          expenses: 0,
          month: month,
          year: year,
          sortKey: year * 100 + month // For sorting
        };
      }
      
      // Fill in actual data
      rows.forEach(row => {
        const year = row.year;
        const month = row.month;
        const monthKey = `${year}-${month}`;
        
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].expenses = parseFloat(row.total_amount) || 0;
        }
      });
      
      // Convert to array and sort
      const trendData = Object.values(monthlyData)
        .sort((a, b) => a.sortKey - b.sortKey);
      
      return { success: true, data: trendData };
    } catch (error) {
      console.error('Error getting expenses trend:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = Expense; 