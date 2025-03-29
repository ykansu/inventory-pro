import React, { useState } from 'react';

const POS = () => {
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="pos-page">
      <div className="pos-container">
        <div className="pos-left-panel">
          <div className="product-search">
            <input
              type="text"
              placeholder="Scan barcode or search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="search-button">Search</button>
          </div>

          <div className="product-categories">
            <button className="category-button active">All</button>
            <button className="category-button">Electronics</button>
            <button className="category-button">Clothing</button>
            <button className="category-button">Food</button>
          </div>

          <div className="product-grid">
            <div className="product-grid-empty">
              <p>No products available. Add products to your inventory first.</p>
            </div>
            {/* Product grid items will be dynamically generated here */}
          </div>
        </div>

        <div className="pos-right-panel">
          <div className="cart-header">
            <h3>Current Sale</h3>
            <button className="clear-cart-button">Clear</button>
          </div>

          <div className="cart-items">
            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <p>No items in cart</p>
                <p>Add products by scanning or searching</p>
              </div>
            ) : (
              <div className="cart-item-list">
                {/* Cart items will be dynamically generated here */}
              </div>
            )}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>$0.00</span>
            </div>
            <div className="summary-row">
              <span>Tax (10%):</span>
              <span>$0.00</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>$0.00</span>
            </div>
          </div>

          <div className="payment-actions">
            <button className="payment-button cash">Cash Payment</button>
            <button className="payment-button card">Card Payment</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
