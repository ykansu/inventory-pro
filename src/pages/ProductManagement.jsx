import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'add'
  const { t } = useTranslation(['products', 'common']);

  return (
    <div className="product-management-page">
      <div className="page-header">
        <h2>{t('products:title')}</h2>
        <div className="page-tabs">
          <button 
            className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            {t('products:tabs.list')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            {t('products:tabs.add')}
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="product-list-container">
          <div className="product-filters">
            <input 
              type="text" 
              placeholder={t('products:search.placeholder')} 
              className="search-input"
            />
            <select className="filter-select">
              <option value="">{t('products:filters.allCategories')}</option>
              <option value="electronics">{t('products:categories.electronics')}</option>
              <option value="clothing">{t('products:categories.clothing')}</option>
              <option value="food">{t('products:categories.food')}</option>
            </select>
            <select className="filter-select">
              <option value="">{t('products:filters.allStockLevels')}</option>
              <option value="in-stock">{t('products:filters.inStock')}</option>
              <option value="low-stock">{t('products:filters.lowStock')}</option>
              <option value="out-of-stock">{t('products:filters.outOfStock')}</option>
            </select>
          </div>

          <div className="product-table-container">
            <table className="product-table">
              <thead>
                <tr>
                  <th>{t('products:table.headers.name')}</th>
                  <th>{t('products:table.headers.sku')}</th>
                  <th>{t('products:table.headers.category')}</th>
                  <th>{t('products:table.headers.price')}</th>
                  <th>{t('products:table.headers.stock')}</th>
                  <th>{t('products:table.headers.actions')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="empty-state">
                  <td colSpan="6">
                    <p>{t('products:emptyState')}</p>
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
                <label htmlFor="productName">{t('products:form.name')} *</label>
                <input 
                  type="text" 
                  id="productName" 
                  name="productName" 
                  placeholder={t('products:form.namePlaceholder')}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="barcode">{t('products:form.barcode')}</label>
                <input 
                  type="text" 
                  id="barcode" 
                  name="barcode" 
                  placeholder={t('products:form.barcodePlaceholder')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">{t('products:form.category')} *</label>
                <select id="category" name="category" required>
                  <option value="">{t('products:form.selectCategory')}</option>
                  <option value="electronics">{t('products:categories.electronics')}</option>
                  <option value="clothing">{t('products:categories.clothing')}</option>
                  <option value="food">{t('products:categories.food')}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="unit">{t('products:form.unit')} *</label>
                <select id="unit" name="unit" required>
                  <option value="">{t('products:form.selectUnit')}</option>
                  <option value="pcs">{t('products:units.pieces')}</option>
                  <option value="kg">{t('products:units.kilograms')}</option>
                  <option value="l">{t('products:units.liters')}</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sellingPrice">{t('products:form.sellingPrice')} *</label>
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
                <label htmlFor="costPrice">{t('products:form.costPrice')} *</label>
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
                <label htmlFor="stockQuantity">{t('products:form.stockQuantity')} *</label>
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
                <label htmlFor="minStockThreshold">{t('products:form.minStockThreshold')} *</label>
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
              <label htmlFor="description">{t('products:form.description')}</label>
              <textarea 
                id="description" 
                name="description" 
                placeholder={t('products:form.descriptionPlaceholder')}
                rows="4"
              ></textarea>
            </div>

            <div className="form-actions">
              <button type="button" className="button secondary" onClick={() => setActiveTab('list')}>
                {t('common:cancel')}
              </button>
              <button type="submit" className="button primary">
                {t('products:form.saveProduct')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
