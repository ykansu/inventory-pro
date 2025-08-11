import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'react-hot-toast';
import styles from './ProductManagement.module.css';
import Button from '../common/Button';
import FormGroup from '../common/FormGroup';
import Table from '../common/Table';
import Pagination from '../common/Pagination';

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'add', 'edit', 'categories', or 'suppliers'
  const { t } = useTranslation(['products', 'common']);
  const { products, categories, suppliers, isLoading } = useDatabase();
  const { getCurrency } = useSettings();
  
  // State for product data
  const [productList, setProductList] = useState([]);
  const [deletedProducts, setDeletedProducts] = useState([]);
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
  const [deletedFilter, setDeletedFilter] = useState('active'); // 'active', 'deleted', 'all'
  
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
        setLoading(true);
        
        // Fetch data in parallel
        const [productsData, deletedProductsData, categoriesData, suppliersData] = await Promise.all([
          products.getAllProducts(),
          products.getDeletedProducts(),
          categories.getAllCategories(),
          suppliers.getAllSuppliers()
        ]);
        
        setProductList(productsData || []);
        setDeletedProducts(deletedProductsData || []);
        setFilteredProducts(productsData || []);
        setCategoryList(categoriesData || []);
        setSupplierList(suppliersData || []);
        setError(null);
      } catch (err) {
        setError('Failed to load product data. Please check the database connection.');
        toast.error(t('products:errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [products, categories, suppliers, t]);

  // Set currency symbol based on current currency
  useEffect(() => {
    const setCurrencySymbolFromSettings = () => {
      const currency = getCurrency();
      
      // Map currency to symbol
      const currencyMap = {
        'usd': '$',
        'eur': '€',
        'gbp': '£',
        'try': '₺'
      };
      
      setCurrencySymbol(currencyMap[currency] || '$');
    };
    
    setCurrencySymbolFromSettings();
  }, [getCurrency]);

  // Format price with currency symbol
  const formatPrice = (price) => {
    return `${currencySymbol}${price.toFixed(2)}`;
  };

  // Apply filters and search
  useEffect(() => {
    let results = [];
    
    // Select base product list based on deleted filter
    if (deletedFilter === 'deleted') {
      results = [...deletedProducts];
    } else if (deletedFilter === 'all') {
      results = [...productList, ...deletedProducts];
    } else {
      results = [...productList];
    }
    
    // Apply search query
    if (searchQuery) {
      results = results.filter(product => {
        // Turkish search comparison function that handles all character variations
        const makeTurkishSearchable = (str) => {
          if (!str) return '';
          return str
            .toLowerCase()
            // Standardize Turkish characters to Latin equivalents
            .replace(/ı/g, 'i')
            .replace(/i̇/g, 'i')
            .replace(/İ/g, 'i')
            .replace(/I/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/Ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/Ü/g, 'u')
            .replace(/ö/g, 'o')
            .replace(/Ö/g, 'o')
            .replace(/ş/g, 's')
            .replace(/Ş/g, 's')
            .replace(/ç/g, 'c')
            .replace(/Ç/g, 'c');
        };
        
        // Convert product data and search query to searchable format
        const searchableProductName = makeTurkishSearchable(product.name);
        const searchableQuery = makeTurkishSearchable(searchQuery);
        const searchableDescription = makeTurkishSearchable(product.description);
        
        // Check if the searchable product name/description contains the searchable query
        const nameMatch = searchableProductName.includes(searchableQuery);
        const descriptionMatch = searchableDescription.includes(searchableQuery);
        
        // For barcode, just do a simple case-insensitive search (it's usually numeric)
        const barcodeMatch = product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase());
        
        return nameMatch || barcodeMatch || descriptionMatch;
      });
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
  }, [productList, deletedProducts, searchQuery, categoryFilter, stockFilter, deletedFilter]);

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
    
    // Check required fields based on the database schema plus stock-related fields
    const requiredFields = ['name', 'selling_price', 'cost_price', 'stock_quantity', 'min_stock_threshold', 'category_id'];
    let hasErrors = false;
    
    for (const field of requiredFields) {
      if (!formData[field] && formData[field] !== 0) {
        hasErrors = true;
        // Force re-render to show validation messages
        setFormData({...formData});
        break;
      }
    }
    
    if (hasErrors) {
      toast.error(t('common:pleaseFixErrors'));
      return;
    }
    
    try {
      setLoading(true);
      
      // Format the data for the database
      const productData = {
        ...formData,
        selling_price: parseFloat(formData.selling_price),
        cost_price: parseFloat(formData.cost_price),
        stock_quantity: parseFloat(formData.stock_quantity),
        min_stock_threshold: parseFloat(formData.min_stock_threshold),
        category_id: parseInt(formData.category_id, 10),
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
      setError('Failed to save product. Please try again.');
      toast.error(formData.id ? t('products:errors.updateFailed') : t('products:errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Handle product deletion (soft delete)
  const handleDeleteProduct = async (id) => {
    if (window.confirm(t('products:deleteConfirmation'))) {
      try {
        setLoading(true);
        await products.deleteProduct(id);
        
        // Reload both active and deleted products
        const [updatedProducts, updatedDeletedProducts] = await Promise.all([
          products.getAllProducts(),
          products.getDeletedProducts()
        ]);
        
        setProductList(updatedProducts || []);
        setDeletedProducts(updatedDeletedProducts || []);
        setError(null);
        toast.success(t('products:notifications.deleteSuccess'));
      } catch (err) {
        setError('Failed to delete product. Please try again.');
        toast.error(t('products:errors.deleteFailed'));
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle product restoration
  const handleRestoreProduct = async (id) => {
    if (window.confirm(t('products:restoreConfirmation'))) {
      try {
        setLoading(true);
        await products.restoreProduct(id);
        
        // Reload both active and deleted products
        const [updatedProducts, updatedDeletedProducts] = await Promise.all([
          products.getAllProducts(),
          products.getDeletedProducts()
        ]);
        
        setProductList(updatedProducts || []);
        setDeletedProducts(updatedDeletedProducts || []);
        setError(null);
        toast.success(t('products:notifications.restoreSuccess'));
      } catch (err) {
        setError('Failed to restore product. Please try again.');
        toast.error(t('products:errors.restoreFailed'));
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle hard deletion of a product
  const handleHardDeleteProduct = async (id) => {
    if (window.confirm(t('products:hardDeleteConfirmation'))) {
      try {
        setLoading(true);
        // We need to add a hardDelete method to the service
        await products.deleteProduct(id); // This will be a hard delete for now
        
        // Reload both active and deleted products
        const [updatedProducts, updatedDeletedProducts] = await Promise.all([
          products.getAllProducts(),
          products.getDeletedProducts()
        ]);
        
        setProductList(updatedProducts || []);
        setDeletedProducts(updatedDeletedProducts || []);
        setError(null);
        toast.success(t('products:notifications.hardDeleteSuccess'));
      } catch (err) {
        setError('Failed to permanently delete product. Please try again.');
        toast.error(t('products:errors.hardDeleteFailed'));
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
      <div className={styles.page}>
        <div className={styles.loadingIndicator}>
          {t('common:loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorMessage}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>{t('products:title')}</h2>
        {activeTab === 'list' && (
          <Button 
            variant="primary" 
            onClick={() => {
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
              setActiveTab('add');
            }}
          >
            {t('products:tabs.add')}
          </Button>
        )}
      </div>
      
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'list' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('list')}
        >
          {t('products:tabs.list')}
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'categories' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          {t('products:tabs.categories')}
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'suppliers' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          {t('products:tabs.suppliers')}
        </button>
      </div>
      
      {activeTab === 'list' ? (
        <>
          <div className={styles.filters}>
            <input
              type="text"
              placeholder={t('products:search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">{t('products:filters.allCategories')}</option>
              {categoryList.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">{t('products:filters.allStockLevels')}</option>
              <option value="out-of-stock">{t('products:filters.outOfStock')}</option>
              <option value="low-stock">{t('products:filters.lowStock')}</option>
              <option value="in-stock">{t('products:filters.inStock')}</option>
            </select>
            
            <select
              value={deletedFilter}
              onChange={(e) => setDeletedFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="active">{t('products:filters.activeProducts')}</option>
              <option value="deleted">{t('products:filters.deletedProducts')}</option>
              <option value="all">{t('products:filters.allProducts')}</option>
            </select>
          </div>
          
          <div className={styles.tableContainer}>
            {loading ? (
              <div className={styles.loadingSpinnerContainer}>
                <div className={styles.loadingSpinner}></div>
              </div>
            ) : error ? (
              <div className={styles.errorMessage}>
                <p>{error}</p>
                <Button onClick={() => loadData()} variant="primary">
                  {t('common:retry')}
                </Button>
              </div>
            ) : (
              <>
                <Table
                  columns={[
                    { key: 'name', label: t('products:table.headers.name') },
                    { key: 'category', label: t('products:table.headers.category') },
                    { key: 'price', label: t('products:table.headers.price') },
                    { key: 'stock', label: t('products:table.headers.stock') },
                    { key: 'actions', label: t('products:table.headers.actions') }
                  ]}
                  data={currentItems.map(product => {
                    // Find the category name
                    const category = categoryList.find(c => c.id === product.category_id);
                    const categoryName = category ? category.name : '';
                    
                    // Determine stock level class
                    let stockLevelClass = '';
                    let stockLevelLabel = '';
                    
                    if (product.stock_quantity <= 0) {
                      stockLevelClass = styles.outOfStock;
                      stockLevelLabel = t('products:filters.outOfStock');
                    } else if (product.stock_quantity <= product.min_stock_threshold) {
                      stockLevelClass = styles.lowStock;
                      stockLevelLabel = t('products:filters.lowStock');
                    } else {
                      stockLevelClass = styles.inStock;
                      stockLevelLabel = t('products:filters.inStock');
                    }
                    
                    return {
                      name: product.name,
                      category: categoryName,
                      price: formatPrice(product.selling_price),
                      stock: (
                        <span className={`${styles.stockLevel} ${stockLevelClass}`}>
                          {product.stock_quantity} {product.unit === 'pcs' ? t('products:units.pieces').split(' ')[0] : product.unit} ({stockLevelLabel})
                        </span>
                      ),
                      actions: (
                        <div className={styles.actionButtons}>
                          {product.is_deleted ? (
                            <button 
                              className={`${styles.actionButton} ${styles.restoreButton}`}
                              onClick={() => handleRestoreProduct(product.id)}
                              title={t('products:restore')}
                            >
                              ↺
                            </button>
                          ) : (
                            <>
                              <button 
                                className={`${styles.actionButton} ${styles.editButton}`}
                                onClick={() => handleEditProduct(product.id)}
                                title={t('common:edit')}
                              >
                                ✏️
                              </button>
                              <button 
                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                onClick={() => handleDeleteProduct(product.id)}
                                title={t('common:delete')}
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      )
                    };
                  })}
                  emptyMessage={t('products:emptyState')}
                />
                
                {/* Pagination */}
                {filteredProducts.length > 0 && (
                  <div className={styles.pagination}>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(filteredProducts.length / itemsPerPage)}
                      totalItems={filteredProducts.length}
                      pageSize={itemsPerPage}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : activeTab === 'categories' ? (
        <div className={styles.categoryContainer}>
          <div className={styles.categoryForm}>
            <h3>
              {categoryFormData.id ? t('products:categories.editCategory') : t('products:categories.addCategory')}
            </h3>
            
            <form onSubmit={handleCategorySubmit}>
              <FormGroup
                label={t('products:categories.name')}
                htmlFor="category-name"
                required
              >
                <input
                  type="text"
                  id="category-name"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  className="form-control"
                  placeholder={t('products:categories.namePlaceholder')}
                  required
                />
              </FormGroup>
              
              <FormGroup
                label={t('products:categories.description')}
                htmlFor="category-description"
              >
                <textarea
                  id="category-description"
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  className="form-control"
                  placeholder={t('products:categories.descriptionPlaceholder')}
                  rows="3"
                />
              </FormGroup>
              
              <div className={styles.formActions}>
                {categoryFormData.id && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCategoryFormData({
                      id: null,
                      name: '',
                      description: ''
                    })}
                  >
                    {t('common:cancel')}
                  </Button>
                )}
                <Button type="submit" variant="primary">
                  {categoryFormData.id ? t('products:categories.update') : t('products:categories.save')}
                </Button>
              </div>
            </form>
          </div>
          
          <div className={styles.categoryList}>
            <h3>{t('products:categories.list')}</h3>
            
            {loading ? (
              <div className={styles.loadingSpinnerContainer}>
                <div className={styles.loadingSpinner}></div>
              </div>
            ) : error ? (
              <div className={styles.errorMessage}>
                <p>{error}</p>
                <Button onClick={() => loadData()} variant="primary">
                  {t('common:retry')}
                </Button>
              </div>
            ) : (
              <Table
                columns={[
                  { key: 'name', label: t('products:categories.name') },
                  { key: 'productCount', label: t('products:categories.productCount') },
                  { key: 'actions', label: t('products:table.headers.actions') }
                ]}
                data={categoryList.map(category => {
                  // Count products in this category
                  const productCount = productList.filter(
                    product => product.category_id === category.id
                  ).length;
                  
                  return {
                    name: category.name,
                    productCount: productCount,
                    actions: (
                      <div className={styles.actionButtons}>
                        <button 
                          className={`${styles.actionButton} ${styles.editButton}`}
                          onClick={() => handleEditCategory(category)}
                          title={t('common:edit')}
                        >
                          ✏️
                        </button>
                        <button 
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleDeleteCategory(category.id)}
                          title={t('common:delete')}
                          disabled={productCount > 0}
                          data-tooltip={productCount > 0 ? t('products:categories.cannotDelete') : ''}
                        >
                          🗑️
                        </button>
                      </div>
                    )
                  };
                })}
                emptyMessage={t('products:categories.emptyState')}
              />
            )}
          </div>
        </div>
      ) : activeTab === 'suppliers' ? (
        <div className={styles.categoryContainer}>
          <div className={styles.categoryForm}>
            <h3>
              {supplierFormData.id 
                ? t('products:suppliers.editSupplier') 
                : t('products:suppliers.addSupplier')
              }
            </h3>
            
            <form onSubmit={handleSupplierSubmit}>
              <FormGroup
                label={t('products:suppliers.companyName')}
                htmlFor="company_name"
                required
              >
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={supplierFormData.company_name}
                  onChange={handleSupplierInputChange}
                  className="form-control"
                  placeholder={t('products:suppliers.companyNamePlaceholder')}
                  required
                />
              </FormGroup>
              
              <FormGroup
                label={t('products:suppliers.contactPerson')}
                htmlFor="contact_person"
              >
                <input
                  type="text"
                  id="contact_person"
                  name="contact_person"
                  value={supplierFormData.contact_person}
                  onChange={handleSupplierInputChange}
                  className="form-control"
                  placeholder={t('products:suppliers.contactPersonPlaceholder')}
                />
              </FormGroup>
              
              <FormGroup
                label={t('products:suppliers.phone')}
                htmlFor="phone"
              >
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={supplierFormData.phone}
                  onChange={handleSupplierInputChange}
                  className="form-control"
                  placeholder={t('products:suppliers.phonePlaceholder')}
                />
              </FormGroup>
              
              <FormGroup
                label={t('products:suppliers.email')}
                htmlFor="email"
              >
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={supplierFormData.email}
                  onChange={handleSupplierInputChange}
                  className="form-control"
                  placeholder={t('products:suppliers.emailPlaceholder')}
                />
              </FormGroup>
              
              <FormGroup
                label={t('products:suppliers.address')}
                htmlFor="address"
              >
                <textarea
                  id="address"
                  name="address"
                  value={supplierFormData.address}
                  onChange={handleSupplierInputChange}
                  className="form-control"
                  placeholder={t('products:suppliers.addressPlaceholder')}
                  rows="2"
                />
              </FormGroup>
              
              <div className={styles.formActions}>
                {supplierFormData.id && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setSupplierFormData({
                      id: null,
                      company_name: '',
                      contact_person: '',
                      phone: '',
                      email: '',
                      address: '',
                      tax_id: '',
                      website: '',
                      notes: ''
                    })}
                  >
                    {t('common:cancel')}
                  </Button>
                )}
                <Button type="submit" variant="primary">
                  {supplierFormData.id ? t('products:suppliers.update') : t('products:suppliers.save')}
                </Button>
              </div>
            </form>
          </div>
          
          <div className={styles.categoryList}>
            <h3>{t('products:suppliers.list')}</h3>
            
            {loading ? (
              <div className={styles.loadingSpinnerContainer}>
                <div className={styles.loadingSpinner}></div>
              </div>
            ) : error ? (
              <div className={styles.errorMessage}>
                <p>{error}</p>
                <Button onClick={() => loadData()} variant="primary">
                  {t('common:retry')}
                </Button>
              </div>
            ) : (
              <Table
                columns={[
                  { key: 'companyName', label: t('products:suppliers.companyName') },
                  { key: 'contactPerson', label: t('products:suppliers.contactPerson') },
                  { key: 'phone', label: t('products:suppliers.phone') },
                  { key: 'actions', label: t('products:table.headers.actions') }
                ]}
                data={supplierList.map(supplier => {
                  // Count products from this supplier
                  const productCount = productList.filter(
                    product => product.supplier_id === supplier.id
                  ).length;
                  
                  return {
                    companyName: supplier.company_name,
                    contactPerson: supplier.contact_person,
                    phone: supplier.phone,
                    actions: (
                      <div className={styles.actionButtons}>
                        <button 
                          className={`${styles.actionButton} ${styles.editButton}`}
                          onClick={() => handleEditSupplier(supplier)}
                          title={t('common:edit')}
                        >
                          ✏️
                        </button>
                        <button 
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          title={t('common:delete')}
                          disabled={productCount > 0}
                          data-tooltip={productCount > 0 ? t('products:suppliers.cannotDelete') : ''}
                        >
                          🗑️
                        </button>
                      </div>
                    )
                  };
                })}
                emptyMessage={t('products:suppliers.emptyState')}
              />
            )}
          </div>
        </div>
      ) : (
        <div className={styles.formContainer}>
          <h3>
            {activeTab === 'add' 
              ? t('products:tabs.add') 
              : t('products:tabs.edit')}
          </h3>
          
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.formRow}>
              <FormGroup
                label={t('products:form.name')}
                htmlFor="name"
                required
                error={formData.name === '' ? t('common:fieldRequired') : ''}
              >
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-control ${formData.name === '' && 'is-invalid'}`}
                  placeholder={t('products:form.namePlaceholder')}
                  required
                />
              </FormGroup>
              
              <FormGroup
                label={t('products:form.barcode')}
                htmlFor="barcode"
              >
                <input
                  type="text"
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder={t('products:form.barcodePlaceholder')}
                />
              </FormGroup>
            </div>
            
            <div className={styles.formRow}>
              <FormGroup
                label={t('products:form.category')}
                htmlFor="category_id"
                required
                error={!formData.category_id ? t('common:fieldRequired') : ''}
              >
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`form-control ${!formData.category_id && 'is-invalid'}`}
                  required
                >
                  <option value="">{t('products:form.selectCategory')}</option>
                  {categoryList.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormGroup>
              
              <FormGroup
                label={t('products:form.unit')}
                htmlFor="unit"
              >
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="pcs">{t('products:units.pieces')}</option>
                  <option value="kg">{t('products:units.kilograms')}</option>
                  <option value="g">{t('products:units.grams')}</option>
                  <option value="l">{t('products:units.liters')}</option>
                  <option value="ml">{t('products:units.liters')}</option>
                  <option value="m">{t('products:units.meters')}</option>
                  <option value="box">{t('products:units.boxes')}</option>
                </select>
              </FormGroup>
            </div>
            
            <div className={styles.formRow}>
              <FormGroup
                label={t('products:form.sellingPrice')}
                htmlFor="selling_price"
                required
                error={!formData.selling_price ? t('common:fieldRequired') : ''}
              >
                <input
                  type="number"
                  id="selling_price"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleInputChange}
                  className={`form-control ${!formData.selling_price && 'is-invalid'}`}
                  min="0"
                  step="0.01"
                  required
                />
              </FormGroup>
              
              <FormGroup
                label={t('products:form.costPrice')}
                htmlFor="cost_price"
                required
                error={!formData.cost_price ? t('common:fieldRequired') : ''}
              >
                <input
                  type="number"
                  id="cost_price"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleInputChange}
                  className={`form-control ${!formData.cost_price && 'is-invalid'}`}
                  min="0"
                  step="0.01"
                  required
                />
              </FormGroup>
            </div>
            
            <div className={styles.formRow}>
              <FormGroup
                label={t('products:form.stockQuantity')}
                htmlFor="stock_quantity"
                required
                error={formData.stock_quantity === '' ? t('common:fieldRequired') : ''}
              >
                <input
                  type="number"
                  id="stock_quantity"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  className={`form-control ${formData.stock_quantity === '' && 'is-invalid'}`}
                  min="0"
                  required
                />
              </FormGroup>
              
              <FormGroup
                label={t('products:form.minStockThreshold')}
                htmlFor="min_stock_threshold"
                required
                error={formData.min_stock_threshold === '' ? t('common:fieldRequired') : ''}
              >
                <input
                  type="number"
                  id="min_stock_threshold"
                  name="min_stock_threshold"
                  value={formData.min_stock_threshold}
                  onChange={handleInputChange}
                  className={`form-control ${formData.min_stock_threshold === '' && 'is-invalid'}`}
                  min="0"
                  required
                />
              </FormGroup>
            </div>
            
            <div className={styles.formRow}>
              <FormGroup
                label={t('products:form.supplier')}
                htmlFor="supplier_id"
              >
                <select
                  id="supplier_id"
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">{t('products:form.selectSupplier')}</option>
                  {supplierList.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                    </option>
                  ))}
                </select>
              </FormGroup>
            </div>
            
            <FormGroup
              label={t('products:form.description')}
              htmlFor="description"
            >
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-control"
                placeholder={t('products:form.descriptionPlaceholder')}
                rows="3"
              />
            </FormGroup>
            
            <div className={styles.formActions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveTab('list')}
              >
                {t('common:cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                {activeTab === 'add' 
                  ? t('products:form.saveProduct') 
                  : t('products:form.updateProduct')}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
