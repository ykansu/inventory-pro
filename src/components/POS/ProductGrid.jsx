import React from 'react';
import styles from './ProductGrid.module.css';
import { useTranslation } from '../../hooks/useTranslation';

const ProductGrid = ({ products, onProductSelect, getUnitName, formatPriceWithCurrency }) => {
  const { t } = useTranslation(['pos', 'common']);

  if (products.length === 0) {
    return (
      <div className={styles.productGridEmpty}>
        <p>{t('pos:productGrid.empty')}</p>
      </div>
    );
  }

  return (
    <div className={styles.productGrid}>
      {products.map(product => (
        <div 
          key={product.id}
          className={`${styles.productCard} ${product.stock_quantity <= 0 ? styles.outOfStock : ''}`}
          onClick={() => product.stock_quantity > 0 && onProductSelect(product)}
        >
          <div className={styles.productName}>{product.name}</div>
          <div className={styles.productPrice}>{formatPriceWithCurrency(product.selling_price)}</div>
          <div className={styles.productStock}>
            {product.stock_quantity <= 0 
              ? t('pos:productGrid.outOfStock') 
              : t('pos:productGrid.inStock', { count: product.stock_quantity, unit: getUnitName(product) })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid; 