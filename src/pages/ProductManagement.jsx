import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useDatabase } from '../context/DatabaseContext';
import { toast } from 'react-hot-toast';

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'add', 'edit', 'categories', or 'suppliers'
  const { t } = useTranslation(['products', 'common']);
  const { products, categories, suppliers, settings, isLoading } = useDatabase();
  
  // State for product data
  const [productList, setProductList] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for currency formatting
  const [currencySymbol, setCurrencySymbol] = useState('$');
  
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

  // State for category form data
  const [categoryFormData, setCategoryFormData] = useState({
    id: null,
    name: '',
    description: ''
  });

  // State for supplier form data
  const [supplierFormData, setSupplierFormData] = useState({
    id: null,
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_id: '',
    website: '',
    notes: ''
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

  // Load currency settings
  useEffect(() => {
    const loadCurrencySettings = async () => {
      try {
        if (settings) {
          const settingsObj = await settings.getAllSettings();
          const currency = settingsObj.currency ? settingsObj.currency.toLowerCase() : 'usd';
          
          // Map currency to symbol
          const currencyMap = {
            'usd': '$',
            'eur': '€',
            'gbp': '£',
            'try': '₺'
          };
          
          setCurrencySymbol(currencyMap[currency] || '$');
        }
      } catch (error) {
        console.error('Error loading currency settings:', error);
      }
    };
    
    loadCurrencySettings();
  }, [settings]);

  // Format price with currency symbol
  const formatPrice = (price) => {
    return `${currencySymbol}${price.toFixed(2)}`;
  };

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
          results = results.filter(product => product.stock_quantity > 0);
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

  // Reset category form
  const resetCategoryForm = useCallback(() => {
    setCategoryFormData({
      id: null,
      name: '',
      description: ''
    });
  }, []);

  // Reset supplier form
  const resetSupplierForm = useCallback(() => {
    setSupplierFormData({
      id: null,
      company_name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      tax_id: '',
      website: '',
      notes: ''
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
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id, 10) : null,
        barcode: formData.barcode.trim() || null // Set to null if empty
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

  // Handle category form input changes
  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission for category
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (categoryFormData.id) {
        // Update existing category
        await categories.updateCategory(categoryFormData.id, categoryFormData);
        toast.success(t('products:notifications.categoryUpdateSuccess', { fallback: 'Category updated successfully' }));
      } else {
        // Create new category
        await categories.createCategory(categoryFormData);
        toast.success(t('products:notifications.categoryCreateSuccess', { fallback: 'Category created successfully' }));
      }
      
      // Reset form and refresh category list
      resetCategoryForm();
      
      // Reload categories
      const updatedCategories = await categories.getAllCategories();
      setCategoryList(updatedCategories || []);
    } catch (err) {
      console.error('Failed to save category:', err);
      setError('Failed to save category. Please try again.');
      toast.error(categoryFormData.id 
        ? t('products:errors.categoryUpdateFailed', { fallback: 'Failed to update category' }) 
        : t('products:errors.categoryCreateFailed', { fallback: 'Failed to create category' }));
    } finally {
      setLoading(false);
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (id) => {
    if (window.confirm(t('products:categoryDeleteConfirmation', { fallback: 'Are you sure you want to delete this category?' }))) {
      try {
        setLoading(true);
        await categories.deleteCategory(id);
        
        // Reload categories
        const updatedCategories = await categories.getAllCategories();
        setCategoryList(updatedCategories || []);
        setError(null);
        toast.success(t('products:notifications.categoryDeleteSuccess', { fallback: 'Category deleted successfully' }));
      } catch (err) {
        console.error(`Failed to delete category ${id}:`, err);
        setError('Failed to delete category. Please try again.');
        toast.error(t('products:errors.categoryDeleteFailed', { fallback: 'Failed to delete category' }));
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle category edit
  const handleEditCategory = (category) => {
    setCategoryFormData({
      id: category.id,
      name: category.name,
      description: category.description || ''
    });
  };

  // Handle supplier form input changes
  const handleSupplierInputChange = (e) => {
    const { name, value } = e.target;
    setSupplierFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission for supplier
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (supplierFormData.id) {
        // Update existing supplier
        await suppliers.updateSupplier(supplierFormData.id, supplierFormData);
        toast.success(t('products:notifications.supplierUpdateSuccess', { fallback: 'Supplier updated successfully' }));
      } else {
        // Create new supplier
        await suppliers.createSupplier(supplierFormData);
        toast.success(t('products:notifications.supplierCreateSuccess', { fallback: 'Supplier created successfully' }));
      }
      
      // Reset form and refresh supplier list
      resetSupplierForm();
      
      // Reload suppliers
      const updatedSuppliers = await suppliers.getAllSuppliers();
      setSupplierList(updatedSuppliers || []);
    } catch (err) {
      console.error('Failed to save supplier:', err);
      setError('Failed to save supplier. Please try again.');
      toast.error(supplierFormData.id 
        ? t('products:errors.supplierUpdateFailed', { fallback: 'Failed to update supplier' }) 
        : t('products:errors.supplierCreateFailed', { fallback: 'Failed to create supplier' }));
    } finally {
      setLoading(false);
    }
  };

  // Handle supplier deletion
  const handleDeleteSupplier = async (id) => {
    if (window.confirm(t('products:supplierDeleteConfirmation', { fallback: 'Are you sure you want to delete this supplier?' }))) {
      try {
        setLoading(true);
        await suppliers.deleteSupplier(id);
        
        // Reload suppliers
        const updatedSuppliers = await suppliers.getAllSuppliers();
        setSupplierList(updatedSuppliers || []);
        setError(null);
        toast.success(t('products:notifications.supplierDeleteSuccess', { fallback: 'Supplier deleted successfully' }));
      } catch (err) {
        console.error(`Failed to delete supplier ${id}:`, err);
        setError('Failed to delete supplier. Please try again.');
        toast.error(t('products:errors.supplierDeleteFailed', { fallback: 'Failed to delete supplier' }));
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle supplier edit
  const handleEditSupplier = (supplier) => {
    setSupplierFormData({
      id: supplier.id,
      company_name: supplier.company_name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
      tax_id: supplier.tax_id || '',
      website: supplier.website || '',
      notes: supplier.notes || ''
    });
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
          <button 
            className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => {
              resetCategoryForm();
              setActiveTab('categories');
            }}
          >
            {t('products:tabs.categories', { fallback: 'Categories' })}
          </button>
          <button 
            className={`tab-button ${activeTab === 'suppliers' ? 'active' : ''}`}
            onClick={() => {
              resetSupplierForm();
              setActiveTab('suppliers');
            }}
          >
            {t('products:tabs.suppliers', { fallback: 'Suppliers' })}
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
                      <td>{formatPrice(product.selling_price)}</td>
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
      ) : activeTab === 'categories' ? (
        <div className="category-management-container">
          <div className="category-form-container">
            <h3>{categoryFormData.id ? t('products:categories.editCategory', { fallback: 'Edit Category' }) : t('products:categories.addCategory', { fallback: 'Add Category' })}</h3>
            <form className="category-form" onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label htmlFor="name">{t('products:form.name')} *</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  placeholder={t('products:categories.namePlaceholder', { fallback: 'Enter category name' })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">{t('products:form.description')}</label>
                <textarea 
                  id="description" 
                  name="description" 
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  placeholder={t('products:categories.descriptionPlaceholder', { fallback: 'Enter category description (optional)' })}
                  rows="3"
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button type="button" className="button secondary" onClick={resetCategoryForm}>
                  {t('common:cancel')}
                </button>
                <button type="submit" className="button primary" disabled={loading}>
                  {loading ? t('common:saving') : categoryFormData.id ? t('products:categories.update', { fallback: 'Update Category' }) : t('products:categories.save', { fallback: 'Save Category' })}
                </button>
              </div>
            </form>
          </div>
          
          <div className="category-list-container">
            <h3>{t('products:categories.list', { fallback: 'Categories List' })}</h3>
            <table className="category-table">
              <thead>
                <tr>
                  <th>{t('products:categories.name', { fallback: 'Name' })}</th>
                  <th>{t('products:categories.description', { fallback: 'Description' })}</th>
                  <th>{t('products:categories.productCount', { fallback: 'Products' })}</th>
                  <th>{t('products:table.headers.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {categoryList.length === 0 ? (
                  <tr className="empty-state">
                    <td colSpan="4">
                      <p>{t('products:categories.emptyState', { fallback: 'No categories found. Add your first category.' })}</p>
                    </td>
                  </tr>
                ) : (
                  categoryList.map(category => (
                    <tr key={category.id}>
                      <td>{category.name}</td>
                      <td>{category.description || '-'}</td>
                      <td>{category.product_count || 0}</td>
                      <td className="action-buttons">
                        <button 
                          className="action-button edit"
                          onClick={() => handleEditCategory(category)}
                        >
                          {t('common:edit')}
                        </button>
                        <button 
                          className="action-button delete" 
                          onClick={() => handleDeleteCategory(category.id)} 
                          disabled={category.product_count > 0}
                          data-tooltip={category.product_count > 0 ? t('products:categories.cannotDelete', { fallback: 'Cannot delete category with products' }) : ''}
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
      ) : activeTab === 'suppliers' ? (
        <div className="supplier-management-container">
          <div className="supplier-form-container">
            <h3>{supplierFormData.id ? t('products:suppliers.editSupplier', { fallback: 'Edit Supplier' }) : t('products:suppliers.addSupplier', { fallback: 'Add Supplier' })}</h3>
            <form className="supplier-form" onSubmit={handleSupplierSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="company_name">{t('products:suppliers.companyName', { fallback: 'Company Name' })} *</label>
                  <input 
                    type="text" 
                    id="company_name" 
                    name="company_name" 
                    value={supplierFormData.company_name}
                    onChange={handleSupplierInputChange}
                    placeholder={t('products:suppliers.companyNamePlaceholder', { fallback: 'Enter company name' })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact_person">{t('products:suppliers.contactPerson', { fallback: 'Contact Person' })} *</label>
                  <input 
                    type="text" 
                    id="contact_person" 
                    name="contact_person" 
                    value={supplierFormData.contact_person}
                    onChange={handleSupplierInputChange}
                    placeholder={t('products:suppliers.contactPersonPlaceholder', { fallback: 'Enter contact person name' })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">{t('products:suppliers.phone', { fallback: 'Phone' })} *</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    value={supplierFormData.phone}
                    onChange={handleSupplierInputChange}
                    placeholder={t('products:suppliers.phonePlaceholder', { fallback: 'Enter phone number' })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">{t('products:suppliers.email', { fallback: 'Email' })}</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={supplierFormData.email}
                    onChange={handleSupplierInputChange}
                    placeholder={t('products:suppliers.emailPlaceholder', { fallback: 'Enter email address' })}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="address">{t('products:suppliers.address', { fallback: 'Address' })}</label>
                <textarea 
                  id="address" 
                  name="address" 
                  value={supplierFormData.address}
                  onChange={handleSupplierInputChange}
                  placeholder={t('products:suppliers.addressPlaceholder', { fallback: 'Enter address' })}
                  rows="3"
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tax_id">{t('products:suppliers.taxId', { fallback: 'Tax ID' })}</label>
                  <input 
                    type="text" 
                    id="tax_id" 
                    name="tax_id" 
                    value={supplierFormData.tax_id}
                    onChange={handleSupplierInputChange}
                    placeholder={t('products:suppliers.taxIdPlaceholder', { fallback: 'Enter tax ID' })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="website">{t('products:suppliers.website', { fallback: 'Website' })}</label>
                  <input 
                    type="url" 
                    id="website" 
                    name="website" 
                    value={supplierFormData.website}
                    onChange={handleSupplierInputChange}
                    placeholder={t('products:suppliers.websitePlaceholder', { fallback: 'Enter website URL' })}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="notes">{t('products:suppliers.notes', { fallback: 'Notes' })}</label>
                <textarea 
                  id="notes" 
                  name="notes" 
                  value={supplierFormData.notes}
                  onChange={handleSupplierInputChange}
                  placeholder={t('products:suppliers.notesPlaceholder', { fallback: 'Enter additional notes' })}
                  rows="3"
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button type="button" className="button secondary" onClick={resetSupplierForm}>
                  {t('common:cancel')}
                </button>
                <button type="submit" className="button primary" disabled={loading}>
                  {loading ? t('common:saving') : supplierFormData.id ? t('products:suppliers.update', { fallback: 'Update Supplier' }) : t('products:suppliers.save', { fallback: 'Save Supplier' })}
                </button>
              </div>
            </form>
          </div>
          
          <div className="supplier-list-container">
            <h3>{t('products:suppliers.list', { fallback: 'Suppliers List' })}</h3>
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>{t('products:suppliers.companyName', { fallback: 'Company Name' })}</th>
                  <th>{t('products:suppliers.contactPerson', { fallback: 'Contact Person' })}</th>
                  <th>{t('products:suppliers.phone', { fallback: 'Phone' })}</th>
                  <th>{t('products:suppliers.productCount', { fallback: 'Products' })}</th>
                  <th>{t('products:table.headers.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {supplierList.length === 0 ? (
                  <tr className="empty-state">
                    <td colSpan="5">
                      <p>{t('products:suppliers.emptyState', { fallback: 'No suppliers found. Add your first supplier.' })}</p>
                    </td>
                  </tr>
                ) : (
                  supplierList.map(supplier => (
                    <tr key={supplier.id}>
                      <td>{supplier.company_name}</td>
                      <td>{supplier.contact_person}</td>
                      <td>{supplier.phone}</td>
                      <td>{supplier.product_count || 0}</td>
                      <td className="action-buttons">
                        <button 
                          className="action-button edit"
                          onClick={() => handleEditSupplier(supplier)}
                        >
                          {t('common:edit')}
                        </button>
                        <button 
                          className="action-button delete" 
                          onClick={() => handleDeleteSupplier(supplier.id)} 
                          disabled={supplier.product_count > 0}
                          data-tooltip={supplier.product_count > 0 ? t('products:suppliers.cannotDelete', { fallback: 'Cannot delete supplier with products' }) : ''}
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
                  <option value="m">{t('products:units.meters')}</option>
                  <option value="box">{t('products:units.boxes')}</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="selling_price">{t('products:form.sellingPrice')} ({currencySymbol}) *</label>
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
                <label htmlFor="cost_price">{t('products:form.costPrice')} ({currencySymbol}) *</label>
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
