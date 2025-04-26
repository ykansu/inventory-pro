import React, { useMemo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import useRevenueByPayment from '../../hooks/useRevenueByPayment';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';

import { useEffect } from 'react';
import styles from './RevenueByPaymentReport.module.css';

const RevenueByPaymentReport = ({ startDate, endDate }) => {
  const { t } = useTranslation(['reports', 'dashboard']);
  const { getSetting, isLoading: settingsLoading } = useSettings();
  const currency = getSetting('currency', 'usd').toLowerCase();
  const creditCardVendorFee = getSetting('credit_card_vendor_fee', 0.68);

  const { data: revenueByPayment, loading, error, refresh } = useRevenueByPayment(startDate, endDate);


  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // Payment method colors (for possible future use)
  const paymentMethodColors = useMemo(() => ({
    'cash': 'rgba(76, 175, 80, 0.6)',
    'card': 'rgba(33, 150, 243, 0.6)',
    'bank_transfer': 'rgba(156, 39, 176, 0.6)',
    'check': 'rgba(255, 152, 0, 0.6)',
    'mobile_payment': 'rgba(233, 30, 99, 0.6)',
    'split': 'rgba(124, 58, 237, 0.6)',
    'other': 'rgba(158, 158, 158, 0.6)'
  }), []);

  const totalRevenue = useMemo(() =>
    revenueByPayment.reduce((sum, method) => sum + method.revenue, 0),
    [revenueByPayment]
  );

  const getPercentage = (revenue) => {
    return totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : '0.0';
  };

  const getCardRevenue = () => {
    const cardPayment = revenueByPayment.find(item => item.method.toLowerCase() === 'card');
    return cardPayment ? (cardPayment.card_amount || cardPayment.revenue) : 0;
  };

  const getNetCardAmount = (revenue) => {
    const amount = revenue - (revenue * (creditCardVendorFee / 100));
    return parseFloat(amount.toFixed(2));
  };

  if (loading || settingsLoading) {
    return <div className={styles.reportSection}>{t('common:loading')}</div>;
  }
  if (error) {
    return (
      <div className={styles.reportSection}>
        <p>{t('common:error')}</p>
        <button onClick={refresh} className={styles.filterButton}>{t('dashboard:retry')}</button>
      </div>
    );
  }
  if (!revenueByPayment.length) {
    return (
      <div className={styles.reportSection}>
        <p>{t('reports:noData')}</p>
      </div>
    );
  }

  return (
    <div className={styles.reportSection}>
      <h4>{t('reports:types.revenueByPayment', 'Revenue by Payment Method')}</h4>
      <table className={styles.reportTable}>
        <thead>
          <tr>
            <th>{t('dashboard:labels.method')}</th>
            <th>{t('dashboard:labels.revenue')}</th>
            <th>{t('dashboard:labels.percentage')}</th>
          </tr>
        </thead>
        <tbody>
          {revenueByPayment.map((item, index) => (
            <tr key={index}>
              <td>{t(`dashboard:paymentMethods.${item.method}`)}</td>
              <td>{formatCurrency(item.revenue, currency)}</td>
              <td>{getPercentage(item.revenue)}%</td>
            </tr>
          ))}
          {/* Net card amount after fee row */}
          {revenueByPayment.some(item => item.method.toLowerCase() === 'card') && (
            <tr className={styles.netCardRow}>
              <td>{t('dashboard:labels.netCardAmountAfterFee')}</td>
              <td>
                {formatCurrency(getNetCardAmount(getCardRevenue()), currency)}
                <div className={styles.feeNote}>
                  {t('dashboard:labels.feePercentage', { 0: (creditCardVendorFee * 100).toFixed(1) })}
                </div>
              </td>
              <td>-</td>
            </tr>
          )}
          {/* Total row */}
          <tr>
            <td><strong>{t('dashboard:labels.total')}</strong></td>
            <td><strong>{formatCurrency(totalRevenue, currency)}</strong></td>
            <td><strong>100%</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default RevenueByPaymentReport; 