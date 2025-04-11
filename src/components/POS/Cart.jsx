import React from 'react';
import styles from './Cart.module.css';
import { useTranslation } from '../../hooks/useTranslation';

const Cart = ({ 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart, 
  getUnitName,
  formatPriceWithCurrency,
  children
}) => {
  const { t } = useTranslation(['pos', 'common']);

  return (
    <div className={styles.rightPanel}>
      <div className={styles.cartHeader}>
        <h3>{t('pos:cart.title')}</h3>
        <button 
          className={styles.clearCartButton} 
          onClick={onClearCart}
        >
          {t('pos:cart.clear')}
        </button>
      </div>

      <div className={styles.cartItems}>
        {cartItems.length === 0 ? (
          <div className={styles.cartEmpty}>
            <p>{t('pos:cart.empty')}</p>
            <p>{t('pos:cart.addInstructions')}</p>
          </div>
        ) : (
          <div className={styles.cartItemList}>
            {cartItems.map(item => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemDetails}>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemPrice}>
                    {formatPriceWithCurrency(item.price)} × 
                    <input
                      type="number"
                      min="1"
                      max={item.product.stock_quantity}
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value))}
                      className={styles.quantityInput}
                    />
                    <span className={styles.unitName}>{getUnitName(item.product)}</span>
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <span className={styles.itemTotal}>{formatPriceWithCurrency(item.totalPrice)}</span>
                  <button 
                    className={styles.removeItemButton}
                    onClick={() => onRemoveItem(item.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
};

export default Cart; 