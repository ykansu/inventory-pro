import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import ProductItem from './ProductItem';
import styles from './ProductList.module.css';

/**
 * Reusable component for displaying a list of products
 * 
 * @param {Object} props - Component props
 * @param {Array} props.products - List of product objects
 * @param {Object|null} props.selectedProduct - Currently selected product
 * @param {Function} props.onSelectProduct - Handler when a product is selected
 * @param {Function} props.formatPrice - Function to format price values
 * @param {Function} props.getUnitName - Function to get unit name for a product
 * @param {boolean} [props.loading] - Whether the list is loading
 * @param {string} [props.className] - Additional CSS class names
 */
const ProductList = ({ 
  products = [],
  selectedProduct,
  onSelectProduct,
  formatPrice,
  getUnitName,
  loading = false,
  className = '',
}) => {
  const { t } = useTranslation(['products', 'common']);

  if (loading) {
    return <div className={styles.loading}>{t('common:loading')}</div>;
  }

  if (products.length === 0) {
    return <div className={styles.noProducts}>{t('products:noSearchResults')}</div>;
  }

  return (
    <div className={`${styles.productsList} ${className}`}>
      {products.map(product => (
        <ProductItem 
          key={product.id}
          product={product}
          isSelected={selectedProduct && selectedProduct.id === product.id}
          onClick={() => onSelectProduct(product)}
          formatPrice={formatPrice}
          getUnitName={getUnitName}
        />
      ))}
    </div>
  );
};

export default ProductList; 