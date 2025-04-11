import React from 'react';
import styles from './PaymentModal.module.css';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';

const PaymentModal = ({
  isOpen,
  onClose,
  paymentMethod,
  amountReceived,
  cashAmount,
  cardAmount,
  splitChange,
  change,
  total,
  onAmountReceivedChange,
  onCashAmountChange,
  onCardAmountChange,
  onProcessPayment,
  formatPriceWithCurrency,
  isProcessing
}) => {
  const { t } = useTranslation(['pos', 'common']);
  
  // Determine modal title based on payment method
  const getModalTitle = () => {
    return t(`pos:payment.${paymentMethod}Title`);
  };
  
  // Footer actions for the modal
  const renderFooter = () => (
    <>
      <Button 
        variant="secondary"
        onClick={onClose}
      >
        {t('common:cancel')}
      </Button>
      <Button 
        onClick={onProcessPayment}
        disabled={
          (paymentMethod === 'cash' && !amountReceived) || 
          (paymentMethod === 'split' && ((parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0) < total)) ||
          isProcessing
        }
      >
        {isProcessing ? t('common:processing') : t('pos:payment.complete')}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      footer={renderFooter()}
      size="extraSmall"
      className={styles.posModal}
      closeOnBackdropClick={false}
    >
      <div className={styles.paymentDetails}>
        <div className={styles.paymentSummary}>
          <div className={styles.summaryRow}>
            <span>{t('pos:summary.total')}:</span>
            <span>{formatPriceWithCurrency(total)}</span>
          </div>
        </div>
        
        {paymentMethod === 'cash' && (
          <div className={styles.cashPaymentForm}>
            <div className={styles.formGroup}>
              <label>{t('pos:payment.amountReceived')}:</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amountReceived}
                onChange={(e) => onAmountReceivedChange(e.target.value)}
                className={styles.amountInput}
                autoFocus
              />
            </div>
            <div className={styles.changeAmount}>
              <span>{t('pos:payment.change')}:</span>
              <span>{formatPriceWithCurrency(change)}</span>
            </div>
            {parseFloat(amountReceived) < total && (
              <div className={styles.shortfallNotice}>
                <span>{t('pos:payment.shortfallNotice')}:</span>
                <span>{formatPriceWithCurrency(total - parseFloat(amountReceived))}</span>
              </div>
            )}
          </div>
        )}

        {paymentMethod === 'split' && (
          <div className={styles.splitPaymentForm}>
            <div className={styles.formGroup}>
              <label>{t('pos:payment.cashPortion')}:</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashAmount}
                onChange={(e) => onCashAmountChange(e.target.value)}
                className={styles.amountInput}
                autoFocus
              />
              {splitChange > 0 && (
                <div className={styles.changeAmount}>
                  <span>{t('pos:payment.change')}:</span>
                  <span>{formatPriceWithCurrency(splitChange)}</span>
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>{t('pos:payment.cardPortion')}:</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cardAmount}
                onChange={(e) => onCardAmountChange(e.target.value)}
                className={styles.amountInput}
                disabled={splitChange > 0}
              />
            </div>
            <div className={`${styles.paymentSummary} ${styles.splitTotal}`}>
              <div className={styles.summaryRow}>
                <span>{t('pos:payment.totalPayment')}:</span>
                <span>{formatPriceWithCurrency((parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0) - splitChange)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PaymentModal; 