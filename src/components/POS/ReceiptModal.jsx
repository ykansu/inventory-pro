import React from 'react';
import styles from './ReceiptModal.module.css';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';

const ReceiptModal = ({
  isOpen,
  onClose,
  receipt,
  formatPriceWithCurrency,
  onPrint,
  receiptRef,
  getUnitName
}) => {
  const { t } = useTranslation(['pos', 'common']);
  
  // Footer actions for the modal
  const renderFooter = () => (
    <>
      <Button 
        variant="secondary"
        onClick={onClose}
      >
        {t('pos:receipt.close')}
      </Button>
      <Button 
        onClick={onPrint}
      >
        {t('pos:receipt.print')}
      </Button>
    </>
  );

  // If no receipt data, don't render
  if (!receipt) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('pos:receipt.title')}
      footer={renderFooter()}
      size="extraSmall"
      className={styles.posModal}
    >
      <div className={styles.receipt} ref={receiptRef}>
        <div className={styles.receiptHeader}>
          <h4>{receipt.businessName}</h4>
          {receipt.businessAddress && <p>{receipt.businessAddress}</p>}
          {receipt.businessPhone && <p>{t('pos:receipt.phone')}: {receipt.businessPhone}</p>}
          {receipt.businessEmail && <p>{t('pos:receipt.email')}: {receipt.businessEmail}</p>}
          {receipt.receiptHeader && <p className={styles.receiptCustomHeader}>{receipt.receiptHeader}</p>}
          <p>{t('pos:receipt.number', { number: receipt.receipt_number })}</p>
          <p>{receipt.date}</p>
        </div>
        <div className={styles.receiptItems}>
          <table>
            <thead>
              <tr>
                <th>{t('pos:receipt.item')}</th>
                <th>{t('pos:receipt.quantity')}</th>
                <th>{t('pos:receipt.price')}</th>
                <th>{t('pos:receipt.total')}</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.quantity} {getUnitName(item.product)}</td>
                  <td>{formatPriceWithCurrency(item.price)}</td>
                  <td>{formatPriceWithCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.receiptSummary}>
          <div className={styles.summaryRow}>
            <span>{t('pos:summary.subtotal')}:</span>
            <span>{formatPriceWithCurrency(receipt.subtotal)}</span>
          </div>
          {receipt.discount > 0 && (
            <div className={`${styles.summaryRow} ${styles.discount}`}>
              <span>{t('pos:summary.discount')}:</span>
              <span>-{formatPriceWithCurrency(receipt.discount)}</span>
            </div>
          )}
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>{t('pos:summary.total')}:</span>
            <span>{formatPriceWithCurrency(receipt.total)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>{t('pos:receipt.paymentMethod')}:</span>
            <span>{t(`pos:paymentMethods.${receipt.payment_method}`)}</span>
          </div>
          
          {receipt.payment_method === 'split' ? (
            <>
              <div className={styles.summaryRow}>
                <span>{t('pos:receipt.cashAmount')}:</span>
                <span>{formatPriceWithCurrency(receipt.cashAmount)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>{t('pos:receipt.cardAmount')}:</span>
                <span>{formatPriceWithCurrency(receipt.cardAmount)}</span>
              </div>
              {receipt.changeAmount > 0 && (
                <div className={styles.summaryRow}>
                  <span>{t('pos:receipt.change')}:</span>
                  <span>{formatPriceWithCurrency(receipt.changeAmount)}</span>
                </div>
              )}
            </>
          ) : receipt.payment_method === 'cash' && (
            <>
              <div className={styles.summaryRow}>
                <span>{t('pos:receipt.amountReceived')}:</span>
                <span>{formatPriceWithCurrency(receipt.amountPaid)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>{t('pos:receipt.change')}:</span>
                <span>{formatPriceWithCurrency(receipt.changeAmount)}</span>
              </div>
            </>
          )}
        </div>
        <div className={styles.thankYou}>
          <p>{receipt.receiptFooter || t('pos:receipt.thankYou')}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal; 