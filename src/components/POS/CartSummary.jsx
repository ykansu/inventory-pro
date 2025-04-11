import React from 'react';
import styles from './CartSummary.module.css';
import { useTranslation } from '../../hooks/useTranslation';

const CartSummary = ({
  subtotal,
  total,
  discount,
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
  onClearDiscount,
  formatPriceWithCurrency
}) => {
  const { t } = useTranslation(['pos', 'common']);
  
  return (
    <div className={styles.cartSummary}>
      <div className={styles.summaryRow}>
        <span>{t('pos:summary.subtotal')}:</span>
        <span>{formatPriceWithCurrency(subtotal)}</span>
      </div>
      
      {/* Discount section */}
      <div className={styles.discountSection}>
        <div className={styles.discountControls}>
          <select 
            value={discountType} 
            onChange={(e) => onDiscountTypeChange(e.target.value)}
            className={styles.discountTypeSelect}
          >
            <option value="fixed">{t('pos:discount.fixed')}</option>
            <option value="percentage">{t('pos:discount.percentage')}</option>
            <option value="total">{t('pos:discount.total')}</option>
          </select>
          <input
            type="number"
            min="0"
            max={discountType === 'percentage' ? '100' : subtotal}
            step="0.01"
            value={discountValue}
            onChange={(e) => onDiscountValueChange(e.target.value)}
            placeholder={
              discountType === 'percentage' ? '0%' : 
              discountType === 'total' ? t('pos:discount.desiredTotal') : '0.00'
            }
            className={styles.discountInput}
          />
          <button 
            onClick={onClearDiscount}
            className={styles.clearDiscount}
            disabled={!discount}
          >
            ×
          </button>
        </div>
        {discount > 0 && (
          <div className={`${styles.summaryRow} ${styles.discountRow}`}>
            <span>{t('pos:summary.discount')}:</span>
            <span>-{formatPriceWithCurrency(discount)}</span>
          </div>
        )}
      </div>
      
      <div className={`${styles.summaryRow} ${styles.total}`}>
        <span>{t('pos:summary.total')}:</span>
        <span>{formatPriceWithCurrency(total)}</span>
      </div>
    </div>
  );
};

export default CartSummary; 