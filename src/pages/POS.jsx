import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const POS = () => {
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation(['pos', 'common']);

  return (
    <div className="pos-page">
      <div className="pos-container">
        <div className="pos-left-panel">
          <div className="product-search">
            <input
              type="text"
              placeholder={t('pos:search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="search-button">{t('pos:search.button')}</button>
          </div>

          <div className="product-categories">
            <button className="category-button active">{t('pos:categories.all')}</button>
            <button className="category-button">{t('pos:categories.electronics')}</button>
            <button className="category-button">{t('pos:categories.clothing')}</button>
            <button className="category-button">{t('pos:categories.food')}</button>
          </div>

          <div className="product-grid">
            <div className="product-grid-empty">
              <p>{t('pos:productGrid.empty')}</p>
            </div>
            {/* Product grid items will be dynamically generated here */}
          </div>
        </div>

        <div className="pos-right-panel">
          <div className="cart-header">
            <h3>{t('pos:cart.title')}</h3>
            <button className="clear-cart-button">{t('pos:cart.clear')}</button>
          </div>

          <div className="cart-items">
            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <p>{t('pos:cart.empty')}</p>
                <p>{t('pos:cart.addInstructions')}</p>
              </div>
            ) : (
              <div className="cart-item-list">
                {/* Cart items will be dynamically generated here */}
              </div>
            )}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>{t('pos:summary.subtotal')}:</span>
              <span>$0.00</span>
            </div>
            <div className="summary-row">
              <span>{t('pos:summary.tax', { rate: '10%' })}:</span>
              <span>$0.00</span>
            </div>
            <div className="summary-row total">
              <span>{t('pos:summary.total')}:</span>
              <span>$0.00</span>
            </div>
          </div>

          <div className="payment-actions">
            <button className="payment-button cash">{t('pos:payment.cash')}</button>
            <button className="payment-button card">{t('pos:payment.card')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
