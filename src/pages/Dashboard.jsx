import React from 'react';

const Dashboard = () => {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>Dashboard Overview</h2>
        <p>Welcome to your inventory management dashboard</p>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Products</h3>
          <div className="stat-value">0</div>
        </div>
        
        <div className="stat-card">
          <h3>Low Stock Items</h3>
          <div className="stat-value">0</div>
        </div>
        
        <div className="stat-card">
          <h3>Today's Sales</h3>
          <div className="stat-value">$0.00</div>
        </div>
        
        <div className="stat-card">
          <h3>Monthly Revenue</h3>
          <div className="stat-value">$0.00</div>
        </div>
      </div>
      
      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3>Recent Sales</h3>
          <div className="placeholder-content">
            <p>No recent sales data available</p>
          </div>
        </div>
        
        <div className="dashboard-section">
          <h3>Popular Products</h3>
          <div className="placeholder-content">
            <p>No product data available</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
