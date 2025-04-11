import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './CostCalculation.module.css';

/**
 * Component for displaying cost averaging calculations 
 * in the stock update form
 * 
 * @param {Object} props - Component props
 * @param {Object} props.calculation - Cost calculation data
 * @param {number} props.calculation.currentStock - Current stock quantity
 * @param {number} props.calculation.currentCostPrice - Current cost price
 * @param {number} props.calculation.newStock - New stock quantity after adjustment
 * @param {number} props.calculation.averageCostPrice - Calculated average cost price
 * @param {number} props.calculation.totalCost - Total inventory cost
 * @param {Function} props.formatPrice - Function to format price values
 * @param {string} [props.className] - Additional CSS class names
 */
const CostCalculation = ({ 
  calculation,
  formatPrice,
  className = ''
}) => {
  const { t } = useTranslation(['products']);
  
  return (
    <div className={`${styles.costCalculationBox} ${className}`}>
      <h4>{t('products:stockUpdate.costCalculation')}</h4>
      <div className={styles.calculationDetails}>
        <div className={styles.calcRow}>
          <span>{t('products:currentStock')}:</span>
          <span>{calculation.currentStock}</span>
        </div>
        <div className={styles.calcRow}>
          <span>{t('products:currentCostPrice')}:</span>
          <span>{formatPrice(calculation.currentCostPrice)}</span>
        </div>
        <div className={`${styles.calcRow} ${styles.total}`}>
          <span>{t('products:stockUpdate.currentInventory')}:</span>
          <span>{formatPrice(calculation.currentStock * calculation.currentCostPrice)}</span>
        </div>
        <div className={`${styles.calcRow} ${styles.result}`}>
          <span>{t('products:stockUpdate.totalInventory')}:</span>
          <span>{calculation.newStock}</span>
        </div>
        <div className={`${styles.calcRow} ${styles.result}`}>
          <span>{t('products:stockUpdate.newAverageCost')}:</span>
          <span>{formatPrice(calculation.averageCostPrice)}</span>
        </div>
        <div className={`${styles.calcRow} ${styles.result}`}>
          <span>{t('products:stockUpdate.newInventory')}:</span>
          <span>{formatPrice(calculation.totalCost)}</span>
        </div>
      </div>
    </div>
  );
};

export default CostCalculation; 