import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useDatabase } from '../context/DatabaseContext';
import { toast } from 'react-hot-toast';

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'add', or 'edit'
  const { t } = useTranslation(['products', 'common']);
  const { products, categories, suppliers, isLoading } = useDatabase();
  
  // State for product data
  const [productList, setProductList] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // State for form data
  const [formData, setFormData] = useState({
    id: null,
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
        setFilteredProducts(productsData || []);
        setCategoryList(categoriesData || []);
        setSupplierList(suppliersData || []);
        setError(null);
      } catch (err) {
        console.error('Failed to load product data:', err);
        setError('Failed to load product data. Please check the database connection.');
        toast.error(t('products:errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [products, categories, suppliers, t]);

  // Apply filters and search
  useEffect(() => {
    let results = [...productList];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(product => 
        product.name.toLowerCase().includes(query) || 
        (product.barcode && product.barcode.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      results = results.filter(product => 
        product.category_id === parseInt(categoryFilter, 10)
      );
    }
    
    // Apply stock level filter
    if (stockFilter) {
      switch (stockFilter) {
        case 'out-of-stock':
          results = results.filter(product => product.stock_quantity <= 0);
          break;
        case 'low-stock':
          results = results.filter(product => 
            product.stock_quantity > 0 && 
            product.stock_quantity <= product.min_stock_threshold
          );
          break;
        case 'in-stock':
          results = results.filter(product => 
            product.stock_quantity > product.min_stock_threshold
          );
          break;
        default:
          break;
      }
    }
    
    setFilteredProducts(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [productList, searchQuery, categoryFilter, stockFilter]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData({
      id: null,
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
  }, []);

  // Handle form submission for new product
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
      
      if (formData.id) {
        // Update existing product
        await products.updateProduct(formData.id, productData);
        toast.success(t('products:notifications.updateSuccess'));
      } else {
        // Create new product
        await products.createProduct(productData);
        toast.success(t('products:notifications.createSuccess'));
      }
      
      // Reset form and refresh product list
      resetForm();
      
      // Reload products
      const updatedProducts = await products.getAllProducts();
      setProductList(updatedProducts || []);
      
      // Switch to list view
      setActiveTab('list');
    } catch (err) {
      console.error('Failed to save product:', err);
      setError('Failed to save product. Please try again.');
      toast.error(formData.id ? t('products:errors.updateFailed') : t('products:errors.createFailed'));
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
        toast.success(t('products:notifications.deleteSuccess'));
      } catch (err) {
        console.error(`Failed to delete product ${id}:`, err);
        setError('Failed to delete product. Please try again.');
        toast.error(t('products:errors.deleteFailed'));
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle product edit
  const handleEditProduct = async (id) => {
    try {
      setLoading(true);
      const product = await products.getProductById(id);
      
      if (product) {
        setFormData({
          id: product.id,
          name: product.name,
          barcode: product.barcode || '',
          category_id: product.category_id ? product.category_id.toString() : '',
          unit: product.unit,
          selling_price: product.selling_price,
          cost_price: product.cost_price,
          stock_quantity: product.stock_quantity,
          min_stock_threshold: product.min_stock_threshold,
          supplier_id: product.supplier_id ? product.supplier_id.toString() : '',
          description: product.description || ''
        });
        
        setActiveTab('edit');
      }
    } catch (err) {
      console.error(`Failed to load product ${id} for editing:`, err);
      setError('Failed to load product for editing. Please try again.');
      toast.error(t('products:errors.loadEditFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
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
            onClick={() => {
              resetForm();
              setActiveTab('add');
            }}
          >
            {t('products:tabs.add')}
          </button>
          {activeTab === 'edit' && (
            <button 
              className={`tab-button active`}
            >
              {t('products:tabs.edit')}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="product-list-container">
          <div className="product-filters">
            <input 
              type="text" 
              placeholder={t('products:search.placeholder')} 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select 
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">{t('products:filters.allCategories')}</option>
              {categoryList.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select 
              className="filter-select"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
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
                {currentItems.length === 0 ? (
                  <tr className="empty-state">
                    <td colSpan="6">
                      <p>{filteredProducts.length === 0 ? t('products:emptyState') : t('products:noSearchResults')}</p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.barcode || '-'}</td>
                      <td>{product.category_name || '-'}</td>
                      <td>{product.selling_price.toFixed(2)}</td>
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
                      <td className="action-buttons">
                        <button 
                          className="action-button edit"
                          onClick={() => handleEditProduct(product.id)}
                        >
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
          
          {/* Pagination */}
          {filteredProducts.length > itemsPerPage && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(1)} 
                disabled={currentPage === 1}
                className="pagination-button"
              >
                &laquo;
              </button>
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                className="pagination-button"
              >
                &lt;
              </button>
              
              <span className="pagination-info">
                {t('common:pagination', { current: currentPage, total: totalPages })}
              </span>
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                &gt;
              </button>
              <button 
                onClick={() => handlePageChange(totalPages)} 
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                &raquo;
              </button>
            </div>
          )}
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
                  <option value="m">{t('products:units.meters')}</option>
                  <option value="box">{t('products:units.boxes')}</option>
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
              <button type="button" className="button secondary" onClick={() => {
                resetForm();
                setActiveTab('list');
              }}>
                {t('common:cancel')}
              </button>
              <button type="submit" className="button primary" disabled={loading}>
                {loading ? t('common:saving') : formData.id ? t('products:form.updateProduct') : t('products:form.saveProduct')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
