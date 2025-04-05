const { ipcMain } = require('electron');
const { Product } = require('../models'); // Adjust path as necessary

function registerProductHandlers() {
  ipcMain.handle('products:getAll', async () => {
    try {
      return await Product.getAllWithDetails();
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  });

  ipcMain.handle('products:getById', async (_, id) => {
    try {
      return await Product.getById(id);
    } catch (error) {
      console.error(`Error getting product ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('products:create', async (_, data) => {
    try {
      return await Product.create(data);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  });

  ipcMain.handle('products:update', async (_, id, data) => {
    try {
      return await Product.update(id, data);
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('products:delete', async (_, id) => {
    try {
      return await Product.delete(id);
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('products:getByBarcode', async (_, barcode) => {
    try {
      return await Product.getByBarcode(barcode);
    } catch (error) {
      console.error(`Error getting product by barcode ${barcode}:`, error);
      throw error;
    }
  });

  ipcMain.handle('products:getLowStock', async () => {
    try {
      return await Product.getLowStock();
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw error;
    }
  });

  ipcMain.handle('products:updateStock', async (_, id, quantity, adjustmentType, reason, reference) => {
    try {
      return await Product.updateStock(id, quantity, adjustmentType, reason, reference);
    } catch (error) {
      console.error(`Error updating stock for product ${id}:`, error);
      throw error;
    }
  });
}

module.exports = { registerProductHandlers }; 