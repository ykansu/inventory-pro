import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ProductService } from '../services/DatabaseService';
import { toast } from 'react-hot-toast';
import '../styles/pages/stock-update.css';

const StockUpdate = () => {
  const { t } = useTranslation(['products', 'common']);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
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
  
  // Filter products when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }
    
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
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
    const quantity = parseInt(newQuantity) || 0;
    const costPrice = parseFloat(newCostPrice) || 0;
    const stock = parseInt(currentStock) || 0;
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
    
    if (parseInt(formData.quantity) <= 0) {
      toast.error(t('common:errors.invalidQuantity'));
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for stock update
      const quantity = parseInt(formData.quantity);
      const adjustmentType = formData.adjustmentType;
      const reason = formData.reason || 'Stock adjustment';
      
      // Reference for the adjustment
      const reference = `Stock-${adjustmentType}-${new Date().toISOString()}`;
      
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
                  <div className="no-products">{t('products:noProducts')}</div>
                ) : (
                  filteredProducts.map(product => (
                    <div 
                      key={product.id} 
                      className={`product-item ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                      onClick={() => handleSelectProduct(product)}
                    >
                      <div className="product-name">{product.name}</div>
                      <div className="product-barcode">{product.barcode || t('common:notAvailable')}</div>
                      <div className="product-stock">{t('products:stock')}: {product.stock_quantity}</div>
                      <div className="product-cost">{t('products:costPrice')}: ${parseFloat(product.cost_price).toFixed(2)}</div>
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
                    value={selectedProduct.stock_quantity || 0} 
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('products:currentCostPrice')}</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={`$${parseFloat(selectedProduct.cost_price).toFixed(2)}`} 
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('products:currentSellingPrice')}</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={`$${parseFloat(selectedProduct.selling_price).toFixed(2)}`} 
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
                  <label>{t('products:quantity')} *</label>
                  <input 
                    type="number"
                    name="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              {formData.adjustmentType === 'add' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('products:newCostPrice')} *</label>
                    <input 
                      type="number"
                      name="newCostPrice"
                      min="0.01"
                      step="0.01"
                      value={formData.newCostPrice}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>{t('products:newSellingPrice')}</label>
                    <input 
                      type="number"
                      name="newSellingPrice"
                      min="0.01"
                      step="0.01"
                      value={formData.newSellingPrice}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label>{t('products:reason')}</label>
                <textarea 
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="2"
                />
              </div>
              
              {formData.adjustmentType === 'add' && costCalculation.currentStock > 0 && (
                <div className="cost-calculation-box">
                  <h4>{t('products:stockUpdate.costCalculation')}</h4>
                  <div className="calculation-details">
                    <div className="calc-row">
                      <span>{t('products:stockUpdate.currentInventory')}:</span>
                      <span>{costCalculation.currentStock} units × ${parseFloat(costCalculation.currentCostPrice).toFixed(2)} = ${(costCalculation.currentStock * costCalculation.currentCostPrice).toFixed(2)}</span>
                    </div>
                    <div className="calc-row">
                      <span>{t('products:stockUpdate.newInventory')}:</span>
                      <span>{formData.quantity} units × ${parseFloat(formData.newCostPrice).toFixed(2)} = ${(formData.quantity * formData.newCostPrice).toFixed(2)}</span>
                    </div>
                    <div className="calc-row total">
                      <span>{t('products:stockUpdate.totalInventory')}:</span>
                      <span>{costCalculation.newStock} units, ${costCalculation.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="calc-row result">
                      <span>{t('products:stockUpdate.newAverageCost')}:</span>
                      <span>${costCalculation.averageCostPrice.toFixed(2)}</span>
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
                  disabled={loading}
                >
                  {loading ? t('common:processing') : t('common:update')}
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