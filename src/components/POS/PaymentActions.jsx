import React from 'react';
import styles from './PaymentActions.module.css';
import { useTranslation } from '../../hooks/useTranslation';

const PaymentActions = ({ 
  onCashPayment, 
  onCardPayment, 
  onSplitPayment, 
  isCartEmpty,
  total
}) => {
  const { t } = useTranslation(['pos', 'common']);
  
  return (
    <div className={styles.paymentActions}>
      <button 
        className={`${styles.paymentButton} ${styles.cash}`}
        onClick={onCashPayment}
        disabled={isCartEmpty}
      >
        {t('pos:payment.cash')}
      </button>
      <button 
        className={`${styles.paymentButton} ${styles.card}`}
        onClick={onCardPayment}
        disabled={isCartEmpty}
      >
        {t('pos:payment.card')}
      </button>
      <button 
        className={`${styles.paymentButton} ${styles.split}`}
        onClick={onSplitPayment}
        disabled={isCartEmpty}
      >
        {t('pos:payment.split')}
      </button>
    </div>
  );
};

export default PaymentActions; 