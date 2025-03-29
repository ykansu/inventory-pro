import React, { useState } from 'react';

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'add'

  return (
    <div className="product-management-page">
      <div className="page-header">
        <h2>Product Management</h2>
        <div className="page-tabs">
          <button 
            className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Product List
          </button>
          <button 
            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Product
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="product-list-container">
          <div className="product-filters">
            <input 
              type="text" 
              placeholder="Search products..." 
              className="search-input"
            />
            <select className="filter-select">
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="food">Food</option>
            </select>
            <select className="filter-select">
              <option value="">All Stock Levels</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          <div className="product-table-container">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU/Barcode</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="empty-state">
                  <td colSpan="6">
                    <p>No products found. Add your first product to get started.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="product-form-container">
          <form className="product-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="productName">Product Name *</label>
                <input 
                  type="text" 
                  id="productName" 
                  name="productName" 
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="barcode">Barcode/SKU</label>
                <input 
                  type="text" 
                  id="barcode" 
                  name="barcode" 
                  placeholder="Enter barcode or SKU"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select id="category" name="category" required>
                  <option value="">Select a category</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="food">Food</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="unit">Unit of Measurement *</label>
                <select id="unit" name="unit" required>
                  <option value="">Select a unit</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="l">Liters (l)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sellingPrice">Selling Price *</label>
                <input 
                  type="number" 
                  id="sellingPrice" 
                  name="sellingPrice" 
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="costPrice">Cost Price *</label>
                <input 
                  type="number" 
                  id="costPrice" 
                  name="costPrice" 
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="stockQuantity">Current Stock Quantity *</label>
                <input 
                  type="number" 
                  id="stockQuantity" 
                  name="stockQuantity" 
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="minStockThreshold">Minimum Stock Threshold *</label>
                <input 
                  type="number" 
                  id="minStockThreshold" 
                  name="minStockThreshold" 
                  placeholder="5"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea 
                id="description" 
                name="description" 
                placeholder="Enter product description"
                rows="4"
              ></textarea>
            </div>

            <div className="form-actions">
              <button type="button" className="button secondary" onClick={() => setActiveTab('list')}>
                Cancel
              </button>
              <button type="submit" className="button primary">
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
