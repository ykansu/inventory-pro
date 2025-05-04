const { ipcMain } = require('electron');
const { Expense, ExpenseCategory } = require('../models');

function registerExpenseHandlers() {
  // Get all expenses with optional filters
  ipcMain.handle('expenses:getAll', async (_, filters = {}) => {
    try {
      return await Expense.getAll(filters);
    } catch (error) {
      console.error('Error getting expenses:', error);
      return { success: false, error: error.message };
    }
  });

  // Get expense by ID
  ipcMain.handle('expenses:getById', async (_, id) => {
    try {
      return await Expense.getById(id);
    } catch (error) {
      console.error(`Error getting expense ${id}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Create new expense
  ipcMain.handle('expenses:create', async (_, expenseData) => {
    try {
      return await Expense.create(expenseData);
    } catch (error) {
      console.error('Error creating expense:', error);
      return { success: false, error: error.message };
    }
  });

  // Update expense
  ipcMain.handle('expenses:update', async (_, id, expenseData) => {
    try {
      return await Expense.update(id, expenseData);
    } catch (error) {
      console.error(`Error updating expense ${id}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Delete expense
  ipcMain.handle('expenses:delete', async (_, id) => {
    try {
      return await Expense.delete(id);
    } catch (error) {
      console.error(`Error deleting expense ${id}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Get monthly expenses
  ipcMain.handle('expenses:getMonthlyExpenses', async () => {
    try {
      return { 
        success: true, 
        data: await Expense.getMonthlyExpenses() 
      };
    } catch (error) {
      console.error('Error getting monthly expenses:', error);
      return { success: false, error: error.message };
    }
  });

  // Get monthly expenses by date range
  ipcMain.handle('expenses:getMonthlyExpensesByDate', async (_, startDate, endDate) => {
    try {
      return await Expense.getMonthlyExpensesByDate(startDate, endDate);
    } catch (error) {
      console.error('Error getting monthly expenses by date:', error);
      return { success: false, error: error.message, data: 0 };
    }
  });

  // Get expenses by category
  ipcMain.handle('expenses:getByCategory', async (_, startDate, endDate) => {
    try {
      return await Expense.getExpensesByCategory(startDate, endDate);
    } catch (error) {
      console.error('Error getting expenses by category:', error);
      return { success: false, error: error.message };
    }
  });

  // Get all expense categories
  ipcMain.handle('expense-categories:getAll', async () => {
    try {
      return await ExpenseCategory.getAll();
    } catch (error) {
      console.error('Error getting expense categories:', error);
      return { success: false, error: error.message };
    }
  });

  // Get expense category by ID
  ipcMain.handle('expense-categories:getById', async (_, id) => {
    try {
      return await ExpenseCategory.getById(id);
    } catch (error) {
      console.error(`Error getting expense category ${id}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Create new expense category
  ipcMain.handle('expense-categories:create', async (_, categoryData) => {
    try {
      return await ExpenseCategory.create(categoryData);
    } catch (error) {
      console.error('Error creating expense category:', error);
      return { success: false, error: error.message };
    }
  });

  // Update expense category
  ipcMain.handle('expense-categories:update', async (_, id, categoryData) => {
    try {
      return await ExpenseCategory.update(id, categoryData);
    } catch (error) {
      console.error(`Error updating expense category ${id}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Delete expense category
  ipcMain.handle('expense-categories:delete', async (_, id) => {
    try {
      return await ExpenseCategory.delete(id);
    } catch (error) {
      console.error(`Error deleting expense category ${id}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Get categories with expense count
  ipcMain.handle('expense-categories:getWithExpenseCount', async () => {
    try {
      return await ExpenseCategory.getCategoriesWithExpenseCount();
    } catch (error) {
      console.error('Error getting expense categories with count:', error);
      return { success: false, error: error.message };
    }
  });

  // Get expenses trend data
  ipcMain.handle('expenses:getExpensesTrend', async (_, months = 6) => {
    try {
      return await Expense.getExpensesTrend(months);
    } catch (error) {
      console.error('Error getting expenses trend data:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerExpenseHandlers }; 