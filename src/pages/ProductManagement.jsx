import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useDatabase } from '../context/DatabaseContext';

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'add'
  const { t } = useTranslation(['products', 'common']);
  const { products, categories, suppliers, isLoading } = useDatabase();
  
  // State for product data
  const [productList, setProductList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category_id: '',
    unit: 'pcs',
    selling_price: '',
    cost_price: '',
    stock_quantity: 0,
    min_stock_threshold: 5,
    supplier_id: '',
    description: ''
  });

  // Load products, categories, and suppliers on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading product data...');
        setLoading(true);
        
        // Fetch data in parallel
        const [productsData, categoriesData, suppliersData] = await Promise.all([
          products.getAllProducts(),
          categories.getAllCategories(),
          suppliers.getAllSuppliers()
        ]);
        
        setProductList(productsData || []);
        setCategoryList(categoriesData || []);
        setSupplierList(suppliersData || []);
        setError(null);
      } catch (err) {
        console.error('Failed to load product data:', err);
        setError('Failed to load product data. Please check the database connection.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [products, categories, suppliers]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Format the data for the database
      const productData = {
        ...formData,
        selling_price: parseFloat(formData.selling_price),
        cost_price: parseFloat(formData.cost_price),
        stock_quantity: parseInt(formData.stock_quantity, 10),
        min_stock_threshold: parseInt(formData.min_stock_threshold, 10),
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id, 10) : null
      };
      
      // Create the product
      await products.createProduct(productData);
      
      // Reset form and refresh product list
      setFormData({
        name: '',
        barcode: '',
        category_id: '',
        unit: 'pcs',
        selling_price: '',
        cost_price: '',
        stock_quantity: 0,
        min_stock_threshold: 5,
        supplier_id: '',
        description: ''
      });
      
      // Reload products
      const updatedProducts = await products.getAllProducts();
      setProductList(updatedProducts || []);
      
      // Switch to list view
      setActiveTab('list');
    } catch (err) {
      console.error('Failed to create product:', err);
      setError('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async (id) => {
    if (window.confirm(t('products:deleteConfirmation'))) {
      try {
        setLoading(true);
        await products.deleteProduct(id);
        
        // Reload products
        const updatedProducts = await products.getAllProducts();
        setProductList(updatedProducts || []);
        setError(null);
      } catch (err) {
        console.error(`Failed to delete product ${id}:`, err);
        setError('Failed to delete product. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (isLoading || loading) {
    return (
      <div className="product-management-page">
        <div className="loading-indicator">
          {t('common:loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-management-page">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

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
              {categoryList.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
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
                {productList.length === 0 ? (
                  <tr className="empty-state">
                    <td colSpan="6">
                      <p>{t('products:emptyState')}</p>
                    </td>
                  </tr>
                ) : (
                  productList.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.barcode || '-'}</td>
                      <td>{product.category_name || '-'}</td>
                      <td>{product.selling_price}</td>
                      <td>
                        <span className={
                          product.stock_quantity <= 0 
                            ? 'stock-level out-of-stock' 
                            : product.stock_quantity <= product.min_stock_threshold 
                              ? 'stock-level low-stock' 
                              : 'stock-level in-stock'
                        }>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td>
                        <button className="action-button edit">
                          {t('common:edit')}
                        </button>
                        <button 
                          className="action-button delete"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          {t('common:delete')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="product-form-container">
          <form className="product-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">{t('products:form.name')} *</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleInputChange}
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
                  value={formData.barcode}
                  onChange={handleInputChange}
                  placeholder={t('products:form.barcodePlaceholder')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category_id">{t('products:form.category')} *</label>
                <select 
                  id="category_id" 
                  name="category_id" 
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t('products:form.selectCategory')}</option>
                  {categoryList.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="unit">{t('products:form.unit')} *</label>
                <select 
                  id="unit" 
                  name="unit" 
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t('products:form.selectUnit')}</option>
                  <option value="pcs">{t('products:units.pieces')}</option>
                  <option value="kg">{t('products:units.kilograms')}</option>
                  <option value="l">{t('products:units.liters')}</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="selling_price">{t('products:form.sellingPrice')} *</label>
                <input 
                  type="number" 
                  id="selling_price" 
                  name="selling_price" 
                  value={formData.selling_price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cost_price">{t('products:form.costPrice')} *</label>
                <input 
                  type="number" 
                  id="cost_price" 
                  name="cost_price" 
                  value={formData.cost_price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="stock_quantity">{t('products:form.stockQuantity')} *</label>
                <input 
                  type="number" 
                  id="stock_quantity" 
                  name="stock_quantity" 
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="min_stock_threshold">{t('products:form.minStockThreshold')} *</label>
                <input 
                  type="number" 
                  id="min_stock_threshold" 
                  name="min_stock_threshold" 
                  value={formData.min_stock_threshold}
                  onChange={handleInputChange}
                  placeholder="5"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="supplier_id">{t('products:form.supplier')}</label>
                <select 
                  id="supplier_id" 
                  name="supplier_id" 
                  value={formData.supplier_id}
                  onChange={handleInputChange}
                >
                  <option value="">{t('products:form.selectSupplier')}</option>
                  {supplierList.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">{t('products:form.description')}</label>
              <textarea 
                id="description" 
                name="description" 
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t('products:form.descriptionPlaceholder')}
                rows="4"
              ></textarea>
            </div>

            <div className="form-actions">
              <button type="button" className="button secondary" onClick={() => setActiveTab('list')}>
                {t('common:cancel')}
              </button>
              <button type="submit" className="button primary" disabled={loading}>
                {loading ? t('common:saving') : t('products:form.saveProduct')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
