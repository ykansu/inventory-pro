const { ipcMain } = require('electron');
const { Supplier } = require('../models');

function registerSupplierHandlers() {
  ipcMain.handle('suppliers:getAll', async () => {
    try {
      return await Supplier.getAllWithProductCount();
    } catch (error) {
      console.error('Error getting suppliers:', error);
      throw error;
    }
  });

  ipcMain.handle('suppliers:getById', async (_, id) => {
    try {
      return await Supplier.getById(id);
    } catch (error) {
      console.error(`Error getting supplier ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('suppliers:create', async (_, data) => {
    try {
      return await Supplier.create(data);
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  });

  ipcMain.handle('suppliers:update', async (_, id, data) => {
    try {
      return await Supplier.update(id, data);
    } catch (error) {
      console.error(`Error updating supplier ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('suppliers:delete', async (_, id) => {
    try {
      return await Supplier.delete(id);
    } catch (error) {
      console.error(`Error deleting supplier ${id}:`, error);
      throw error;
    }
  });
}

module.exports = { registerSupplierHandlers }; 