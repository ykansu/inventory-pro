const { ipcMain } = require('electron');
const { Category } = require('../models');

function registerCategoryHandlers() {
  ipcMain.handle('categories:getAll', async () => {
    try {
      return await Category.getAllWithProductCount();
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  });

  ipcMain.handle('categories:getById', async (_, id) => {
    try {
      return await Category.getById(id);
    } catch (error) {
      console.error(`Error getting category ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('categories:create', async (_, data) => {
    try {
      return await Category.create(data);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  });

  ipcMain.handle('categories:update', async (_, id, data) => {
    try {
      return await Category.update(id, data);
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('categories:delete', async (_, id) => {
    try {
      return await Category.delete(id);
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  });
}

module.exports = { registerCategoryHandlers }; 