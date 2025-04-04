import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ProductService, SettingService } from '../services/DatabaseService';
import { useDatabase } from '../context/DatabaseContext';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';
import '../styles/pages/stock-update.css';

const StockUpdate = () => {
  const { t } = useTranslation(['products', 'common']);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { settings } = useDatabase();
  
  // App settings state
  const [appSettings, setAppSettings] = useState({
    currency: 'usd',
    dateFormat: 'mm/dd/yyyy',
    enableTax: false,
    taxRate: 0
  });
  
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
  
  // Load application settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (settings) {
          const settingsObj = await settings.getAllSettings();
          setAppSettings({
            currency: settingsObj.currency?.toLowerCase() || 'usd',
            dateFormat: settingsObj.date_format || 'mm/dd/yyyy',
            enableTax: settingsObj.enable_tax || false,
            taxRate: parseFloat(settingsObj.tax_rate) || 0
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, [settings]);
  
  // Load all products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const allProducts = await ProductService.getAllProducts();
        setProducts(allProducts);
        setFilteredProducts(allProducts);
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error(t('common:errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [t]);
  
  // Helper function to format currency values consistently
  const formatPrice = (amount) => {
    return formatCurrency(amount, appSettings.currency);
  };
  
  // Format date according to settings
  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    
    switch (appSettings.dateFormat) {
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
      setFilteredProducts(products);
      return;
    }
    
    const searchableQuery = makeTurkishSearchable(searchQuery);
    
    const filtered = products.filter(product => {
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
  }, [searchQuery, products]);
  
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
      await ProductService.updateStock(
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
      
      await ProductService.updateProduct(selectedProduct.id, productUpdateData);
      
      // Show success message
      toast.success(t('common:success.stockUpdated'));
      
      // Refresh product list
      const updatedProducts = await ProductService.getAllProducts();
      setProducts(updatedProducts);
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
  
  return (
    <div className="stock-update-page">
      <h2>{t('products:stockUpdate.title')}</h2>
      
      <div className="stock-update-container">
        <div className="product-search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('common:search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="products-list">
            {loading ? (
              <div className="loading-spinner">{t('common:loading')}</div>
            ) : (
              <>
                {filteredProducts.length === 0 ? (
                  <div className="no-products">{t('products:noSearchResults')}</div>
                ) : (
                  filteredProducts.map(product => (
                    <div 
                      key={product.id} 
                      className={`product-item ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                      onClick={() => handleSelectProduct(product)}
                    >
                      <div className="product-name">{product.name}</div>
                      <div className="product-barcode">{product.barcode || t('common:notAvailable')}</div>
                      <div className="product-stock">{t('products:stock')}: {product.stock_quantity} {getUnitName(product)}</div>
                      <div className="product-cost">{t('products:costPrice')}: {formatPrice(product.cost_price)}</div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="stock-update-form-section">
          {selectedProduct ? (
            <form onSubmit={handleSubmit} className="stock-update-form">
              <h3>{selectedProduct.name}</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{t('products:currentStock')}</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={`${selectedProduct.stock_quantity || 0} ${getUnitName(selectedProduct)}`} 
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('products:currentCostPrice')}</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={formatPrice(selectedProduct.cost_price)} 
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('products:currentSellingPrice')}</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={formatPrice(selectedProduct.selling_price)} 
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{t('products:adjustmentType')}</label>
                  <select
                    name="adjustmentType"
                    value={formData.adjustmentType}
                    onChange={handleAdjustmentTypeChange}
                  >
                    <option value="add">{t('products:add')}</option>
                    <option value="remove">{t('products:remove')}</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>{t('products:quantity')} ({getUnitName(selectedProduct)})</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0.01"
                    step={selectedProduct.unit === 'pieces' || selectedProduct.unit === 'boxes' ? "1" : "0.01"}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{t('products:newCostPrice')}</label>
                  <input
                    type="number"
                    name="newCostPrice"
                    value={formData.newCostPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('products:newSellingPrice')}</label>
                  <input
                    type="number"
                    name="newSellingPrice"
                    value={formData.newSellingPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{t('products:reason')}</label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows="2"
                  ></textarea>
                </div>
              </div>
              
              {formData.adjustmentType === 'add' && costCalculation.currentStock > 0 && (
                <div className="cost-calculation-box">
                  <h4>{t('products:stockUpdate.costCalculation')}</h4>
                  <div className="calculation-details">
                    <div className="calc-row">
                      <span>{t('products:stockUpdate.currentInventory')}:</span>
                      <span>{costCalculation.currentStock} {getUnitName(selectedProduct)} × {formatPrice(costCalculation.currentCostPrice)} = {formatPrice(costCalculation.currentStock * costCalculation.currentCostPrice)}</span>
                    </div>
                    <div className="calc-row">
                      <span>{t('products:stockUpdate.newInventory')}:</span>
                      <span>{formData.quantity} {getUnitName(selectedProduct)} × {formatPrice(formData.newCostPrice)} = {formatPrice(formData.quantity * formData.newCostPrice)}</span>
                    </div>
                    <div className="calc-row total">
                      <span>{t('products:stockUpdate.totalInventory')}:</span>
                      <span>{costCalculation.newStock} {getUnitName(selectedProduct)}, {formatPrice(costCalculation.totalCost)}</span>
                    </div>
                    <div className="calc-row result">
                      <span>{t('products:stockUpdate.newAverageCost')}:</span>
                      <span>{formatPrice(costCalculation.averageCostPrice)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setSelectedProduct(null)}
                >
                  {t('common:cancel')}
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading || formData.quantity <= 0}
                >
                  {t('common:update')}
                </button>
              </div>
            </form>
          ) : (
            <div className="no-selection-message">
              {t('products:stockUpdate.selectProductPrompt')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockUpdate; 