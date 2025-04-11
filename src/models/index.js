const Product = require('./Product');
const Category = require('./Category');
const Supplier = require('./Supplier');
const Sale = require('./Sale');
const Setting = require('./Setting');
const ExpenseCategory = require('./ExpenseCategory');
const Expense = require('./Expense');

// Export all models
module.exports = {
  Product: new Product(),
  Category: new Category(),
  Supplier: new Supplier(),
  Sale: new Sale(),
  Setting: new Setting(),
  ExpenseCategory: new ExpenseCategory(),
  Expense: new Expense()
};