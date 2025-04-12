import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';

// Import common components
import SearchBox from '../stockUpdate/SearchBox';
import ProductList from '../stockUpdate/ProductList';
import FormGroup from '../common/FormGroup';
import Button from '../common/Button';
import CostCalculation from '../stockUpdate/CostCalculation';

// Import CSS module
import styles from './StockUpdate.module.css';

const StockUpdate = () => {
  const { t } = useTranslation(['products', 'common']);
  const { products, categories, suppliers } = useDatabase();
  const { getCurrency, getDateFormat } = useSettings();
  const [loading, setLoading] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Stock update form state
  const [formData, setFormData] = useState({
    quantity: 0,
    newCostPrice: 0,
    newSellingPrice: 0,
    adjustmentType: 'add',
    reason: ''
  });
  
  // Cost averaging calculation state
  const [costCalculation, setCostCalculation] = useState({
    currentStock: 0,
    currentCostPrice: 0,
    newStock: 0,
    averageCostPrice: 0,
    totalCost: 0
  });
  
  // Load products and categories on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const allProducts = await products.getAllProducts();
        setProductsList(allProducts);
        
        const allCategories = await categories.getAllCategories();
        setCategoriesList(allCategories);
        
        const allSuppliers = await suppliers.getAllSuppliers();
        setSuppliersList(allSuppliers);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error(t('products:errors.loadFailed'));
      }
    };
    
    loadData();
  }, [products, categories, suppliers, t]);
  
  // Helper function to format currency values consistently
  const formatPrice = (amount) => {
    return formatCurrency(amount, getCurrency());
  };
  
  // Format date according to settings
  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    
    switch (getDateFormat()) {
      case 'dd/mm/yyyy':
        return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
      case 'yyyy-mm-dd':
        return `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      case 'mm/dd/yyyy':
      default:
        return `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
    }
  };
  
  // Get the translated unit name for a product
  const getUnitName = (product) => {
    if (!product || !product.unit) return t('products:stockUpdate.units');
    
    // Get the unit key in lowercase
    const unitKey = product.unit.toLowerCase();
    
    // For all unit types, first try to get the abbreviation directly from the pos translations
    // This will return abbreviations like "ad" for pcs, "kg" for kilograms, etc.
    const unitAbbreviation = t(`pos:units.${unitKey}`, { defaultValue: null });
    if (unitAbbreviation) {
      return unitAbbreviation;
    }
    
    // If direct abbreviation not found, try to get the full name with abbreviation in parentheses
    const unitTranslation = t(`products:units.${unitKey}`, { returnObjects: true });
    
    // If we have a proper translation that contains the unit name and symbol, extract just the symbol in parentheses
    if (typeof unitTranslation === 'string' && unitTranslation.includes('(') && unitTranslation.includes(')')) {
      // Extract the abbreviation between parentheses
      const match = unitTranslation.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        return match[1]; // Return just the abbreviation
      }
    }
    
    // Otherwise return the unit as is or fall back to the generic "units" translation
    return product.unit || t('products:stockUpdate.units');
  };
  
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
  
  // Filter products when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(productsList);
      return;
    }
    
    const searchableQuery = makeTurkishSearchable(searchQuery);
    
    const filtered = productsList.filter(product => {
      // Check by name
      const searchableName = makeTurkishSearchable(product.name);
      const nameMatch = searchableName.includes(searchableQuery);
      
      // Check by barcode (if exists)
      const barcodeMatch = product.barcode && 
        makeTurkishSearchable(product.barcode).includes(searchableQuery);
      
      // Check by SKU (if exists)
      const skuMatch = product.sku && 
        makeTurkishSearchable(product.sku).includes(searchableQuery);
        
      return nameMatch || barcodeMatch || skuMatch;
    });
    
    setFilteredProducts(filtered);
  }, [searchQuery, productsList]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle selecting a product
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      quantity: 0,
      newCostPrice: parseFloat(product.cost_price) || 0,
      newSellingPrice: parseFloat(product.selling_price) || 0,
      adjustmentType: 'add',
      reason: ''
    });
    
    // Reset cost calculation
    updateCostCalculation(0, parseFloat(product.cost_price) || 0, product.stock_quantity || 0);
  };
  
  // Update cost calculation when form values change
  const updateCostCalculation = (newQuantity, newCostPrice, currentStock, currentCostPrice) => {
    const quantity = parseFloat(newQuantity) || 0;
    const costPrice = parseFloat(newCostPrice) || 0;
    const stock = parseFloat(currentStock) || 0;
    const currentCost = parseFloat(currentCostPrice) || 0;
    
    let newStock, averageCostPrice, totalCost;
    
    // Only calculate average cost if we're adding stock
    if (formData.adjustmentType === 'add' && quantity > 0) {
      // Total value of current inventory
      const currentTotalValue = stock * currentCost;
      
      // Value of new inventory
      const newInventoryValue = quantity * costPrice;
      
      // New total inventory value
      totalCost = currentTotalValue + newInventoryValue;
      
      // New total quantity
      newStock = stock + quantity;
      
      // New average cost
      averageCostPrice = newStock > 0 ? totalCost / newStock : 0;
    } else {
      newStock = Math.max(0, stock - quantity);
      averageCostPrice = currentCost;
      totalCost = newStock * currentCost;
    }
    
    setCostCalculation({
      currentStock: stock,
      currentCostPrice: currentCost,
      newStock,
      averageCostPrice,
      totalCost
    });
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update cost calculation if quantity or cost price changes
    if (name === 'quantity' || name === 'newCostPrice') {
      if (selectedProduct) {
        updateCostCalculation(
          name === 'quantity' ? value : formData.quantity,
          name === 'newCostPrice' ? value : formData.newCostPrice,
          selectedProduct.stock_quantity,
          selectedProduct.cost_price
        );
      }
    }
  };
  
  // Handle adjustment type change
  const handleAdjustmentTypeChange = (e) => {
    const newAdjustmentType = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      adjustmentType: newAdjustmentType
    }));
    
    // Recalculate with new adjustment type
    if (selectedProduct) {
      updateCostCalculation(
        formData.quantity,
        formData.newCostPrice,
        selectedProduct.stock_quantity,
        selectedProduct.cost_price
      );
    }
  };

  // Handle submit - update stock with new cost price
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.error(t('common:errors.selectProduct'));
      return;
    }
    
    if (parseFloat(formData.quantity) <= 0) {
      toast.error(t('common:errors.invalidQuantity'));
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for stock update
      const quantity = parseFloat(formData.quantity);
      const adjustmentType = formData.adjustmentType;
      const reason = formData.reason || 'Stock adjustment';
      
      // Reference for the adjustment - use formatted date based on settings
      const formattedDate = formatDate(new Date());
      const reference = `Stock-${adjustmentType}-${formattedDate}`;
      
      // Update stock quantity first
      await products.updateStock(
        selectedProduct.id,
        quantity,
        adjustmentType,
        reason,
        reference
      );
      
      // Then update the product with new cost price and selling price (if changed)
      const productUpdateData = {
        cost_price: formData.adjustmentType === 'add' 
          ? costCalculation.averageCostPrice 
          : selectedProduct.cost_price
      };
      
      // Only update selling price if it has changed
      if (formData.newSellingPrice !== selectedProduct.selling_price) {
        productUpdateData.selling_price = formData.newSellingPrice;
      }
      
      await products.updateProduct(selectedProduct.id, productUpdateData);
      
      // Show success message
      toast.success(t('products:notifications.stockUpdateSuccess'));
      
      // Refresh product list
      const updatedProducts = await products.getAllProducts();
      setProductsList(updatedProducts);
      setFilteredProducts(updatedProducts);
      
      // Reset selection and form
      setSelectedProduct(null);
      setFormData({
        quantity: 0,
        newCostPrice: 0,
        newSellingPrice: 0,
        adjustmentType: 'add',
        reason: ''
      });
      
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error(t('common:errors.updateFailed'));
    } finally {
      setLoading(false);
    }
  };
  
  // Reset form
  const handleReset = () => {
    if (selectedProduct) {
      setFormData({
        quantity: 0,
        newCostPrice: parseFloat(selectedProduct.cost_price) || 0,
        newSellingPrice: parseFloat(selectedProduct.selling_price) || 0,
        adjustmentType: 'add',
        reason: ''
      });
      
      updateCostCalculation(0, parseFloat(selectedProduct.cost_price) || 0, selectedProduct.stock_quantity || 0);
    }
  };
  
  return (
    <div className={styles.stockUpdatePage}>
      <h2>{t('products:stockUpdate.title')}</h2>
      
      <div className={styles.stockUpdateContainer}>
        {/* Product Search and Selection Section */}
        <div className={styles.productSearchSection}>
          <SearchBox 
            placeholder={t('products:search.placeholder')}
            value={searchQuery}
            onChange={handleSearchChange}
          />
          
          <ProductList
            products={filteredProducts}
            selectedProduct={selectedProduct}
            onSelectProduct={handleSelectProduct}
            formatPrice={formatPrice}
            getUnitName={getUnitName}
            loading={loading}
          />
        </div>
        
        {/* Stock Update Form Section */}
        <div className={styles.stockUpdateFormSection}>
          {!selectedProduct ? (
            <div className={styles.noSelectionMessage}>
              {t('products:stockUpdate.selectProductPrompt')}
            </div>
          ) : (
            <form className={styles.stockUpdateForm} onSubmit={handleSubmit}>
              <h3>{t('products:stockUpdate.title')}: {selectedProduct.name}</h3>
              
              <div className={styles.formRow}>
                <FormGroup label={t('products:currentStock')}>
                  <input 
                    type="text" 
                    value={`${selectedProduct.stock_quantity || 0} ${getUnitName(selectedProduct)}`} 
                    readOnly 
                    disabled
                    className={styles.readOnlyField}
                  />
                </FormGroup>
                
                <FormGroup label={t('products:currentCostPrice')}>
                  <input 
                    type="text" 
                    value={formatPrice(selectedProduct.cost_price)} 
                    readOnly 
                    disabled
                    className={styles.readOnlyField}
                  />
                </FormGroup>
                
                <FormGroup label={t('products:currentSellingPrice')}>
                  <input 
                    type="text" 
                    value={formatPrice(selectedProduct.selling_price)} 
                    readOnly 
                    disabled
                    className={styles.readOnlyField}
                  />
                </FormGroup>
              </div>
              
              <div className={styles.formRow}>
                <FormGroup label={t('products:adjustmentType')}>
                  <select 
                    name="adjustmentType" 
                    value={formData.adjustmentType}
                    onChange={handleAdjustmentTypeChange}
                  >
                    <option value="add">{t('products:add')}</option>
                    <option value="remove">{t('products:remove')}</option>
                  </select>
                </FormGroup>
                
                <FormGroup label={t('products:quantity')}>
                  <input 
                    type="number" 
                    name="quantity" 
                    min="0" 
                    step="1"
                    value={formData.quantity} 
                    onChange={handleInputChange}
                    required
                  />
                </FormGroup>
              </div>
              
              <div className={styles.formRow}>
                <FormGroup label={t('products:newCostPrice')}>
                  <input 
                    type="number" 
                    name="newCostPrice" 
                    min="0" 
                    step="0.01"
                    value={formData.newCostPrice} 
                    onChange={handleInputChange}
                    disabled={formData.adjustmentType === 'remove'}
                  />
                </FormGroup>
                
                <FormGroup label={t('products:newSellingPrice')}>
                  <input 
                    type="number" 
                    name="newSellingPrice" 
                    min="0" 
                    step="0.01"
                    value={formData.newSellingPrice} 
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </div>
              
              <FormGroup label={t('products:reason')}>
                <textarea 
                  name="reason" 
                  rows="3"
                  value={formData.reason} 
                  onChange={handleInputChange}
                ></textarea>
              </FormGroup>
              
              {/* Cost Calculation Box */}
              {formData.adjustmentType === 'add' && parseFloat(formData.quantity) > 0 && (
                <CostCalculation 
                  calculation={costCalculation}
                  formatPrice={formatPrice}
                />
              )}
              
              <div className={styles.formActions}>
                <Button 
                  variant="secondary" 
                  onClick={handleReset}
                  type="button"
                >
                  {t('common:reset')}
                </Button>
                
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading}
                >
                  {t('common:update')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockUpdate; 