import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './ProductItem.module.css';

/**
 * Reusable component for displaying a product item in a list
 * 
 * @param {Object} props - Component props
 * @param {Object} props.product - Product data
 * @param {boolean} props.isSelected - Whether this item is selected
 * @param {Function} props.onClick - Click handler
 * @param {Function} props.formatPrice - Function to format price values
 * @param {Function} props.getUnitName - Function to get unit name for a product
 * @param {string} [props.className] - Additional CSS class names
 */
const ProductItem = ({ 
  product,
  isSelected,
  onClick,
  formatPrice,
  getUnitName,
  className = '',
}) => {
  const { t } = useTranslation(['products', 'common']);
  
  return (
    <div 
      className={`${styles.productItem} ${isSelected ? styles.selected : ''} ${className}`}
      onClick={onClick}
    >
      <div className={styles.productName}>{product.name}</div>
      {product.barcode && (
        <div className={styles.productBarcode}>
          {product.barcode || t('common:notAvailable')}
        </div>
      )}
      <div className={styles.productStock}>
        {t('products:stock')}: {product.stock_quantity || 0} {getUnitName(product)}
      </div>
      <div className={styles.productCost}>
        {t('products:costPrice')}: {formatPrice(product.cost_price || 0)}
      </div>
    </div>
  );
};

export default ProductItem; 