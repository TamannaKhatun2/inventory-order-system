import React from 'react';
import { Package, Users, ShoppingCart, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Dashboard({ summary, onNavigate }) {
  const {
    total_products = 0,
    total_customers = 0,
    total_orders = 0,
    low_stock_count = 0,
    low_stock_products = []
  } = summary;

  return (
    <div>
      {/* Stat Cards Grid */}
      <div className="dashboard-grid">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('products')}>
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{total_products}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('customers')}>
          <div className="stat-icon" style={{ color: 'var(--accent)' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{total_customers}</span>
            <span className="stat-label">Total Customers</span>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('orders')}>
          <div className="stat-icon success-type">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{total_orders}</span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>

        <div className="stat-card">
          <div className={`stat-icon ${low_stock_count > 0 ? 'warning-type' : 'success-type'}`}>
            {low_stock_count > 0 ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div className="stat-info">
            <span className="stat-value">{low_stock_count}</span>
            <span className="stat-label">Low Stock items</span>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      <div className="glass-panel low-stock-panel">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={20} className={low_stock_count > 0 ? 'text-warning' : 'text-success'} style={{ color: low_stock_count > 0 ? 'var(--warning)' : 'var(--success)' }} />
          Inventory Stock Warning Alerts
        </h2>
        
        {low_stock_products.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(16, 185, 129, 0.25)', color: 'var(--success)' }}>
            <CheckCircle2 size={18} />
            <span>All products are sufficiently stocked. No inventory alerts at this time.</span>
          </div>
        ) : (
          <ul className="low-stock-list">
            {low_stock_products.map((product) => (
              <li key={product.id} className="low-stock-item">
                <div className="low-stock-meta">
                  <span className="low-stock-name">{product.name}</span>
                  <span className="low-stock-sku">SKU: {product.sku}</span>
                </div>
                <div className="low-stock-badge-container">
                  <span className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                    {product.quantity} Left in Stock
                  </span>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigate('products')}
                  >
                    Restock
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
