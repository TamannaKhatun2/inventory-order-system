import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, Users, ShoppingCart, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from './utils/api';
import Dashboard from './components/Dashboard';
import ProductManager from './components/ProductManager';
import CustomerManager from './components/CustomerManager';
import OrderManager from './components/OrderManager';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [summary, setSummary] = useState({});
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  // Toast notifications states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const triggerError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setErrorMsg(''), 6000);
  };

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Fetch all data from backend
  const refreshAllData = async () => {
    setLoading(true);
    try {
      const [sumData, prodData, custData, ordData] = await Promise.all([
        api.getSummary(),
        api.getProducts(),
        api.getCustomers(),
        api.getOrders(),
      ]);
      setSummary(sumData);
      setProducts(prodData);
      setCustomers(custData);
      setOrders(ordData);
    } catch (err) {
      console.error('Error fetching data:', err);
      triggerError('Failed to synchronize database records. Is backend API server online?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleNavigate = (view) => {
    setActiveView(view);
  };

  // Render sub view
  const renderView = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem', color: 'var(--text-muted)' }}>
          <RefreshCw className="animate-spin" size={32} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--primary)', marginBottom: '1rem' }} />
          <span>Synchronizing records with Quantum Engine...</span>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard summary={summary} onNavigate={handleNavigate} />;
      case 'products':
        return (
          <ProductManager
            products={products}
            onRefresh={refreshAllData}
            alertError={triggerError}
            alertSuccess={triggerSuccess}
          />
        );
      case 'customers':
        return (
          <CustomerManager
            customers={customers}
            onRefresh={refreshAllData}
            alertError={triggerError}
            alertSuccess={triggerSuccess}
          />
        );
      case 'orders':
        return (
          <OrderManager
            orders={orders}
            products={products}
            customers={customers}
            onRefresh={refreshAllData}
            alertError={triggerError}
            alertSuccess={triggerSuccess}
          />
        );
      default:
        return <Dashboard summary={summary} onNavigate={handleNavigate} />;
    }
  };

  const getPageInfo = () => {
    switch (activeView) {
      case 'dashboard':
        return { title: 'Dashboard Analytics', desc: 'Real-time monitoring of stock, sales volume, and customer base.' };
      case 'products':
        return { title: 'Product Inventory Catalog', desc: 'Manage your product database, prices, and available stock levels.' };
      case 'customers':
        return { title: 'Customer Records', desc: 'Manage registered business customer profiles and contact details.' };
      case 'orders':
        return { title: 'Sales Order Registry', desc: 'Create, review details, and manage inventory-deducted orders.' };
      default:
        return { title: 'Quantum Inventory', desc: 'Enterprise Grade Supply Chain Hub' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="logo-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px', filter: 'drop-shadow(0 0 8px var(--primary-glow))' }}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <span className="logo-text">Quantum Inventory</span>
        </div>

        <ul className="nav-links">
          <li className="nav-item">
            <button
              className={`nav-button ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavigate('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-button ${activeView === 'products' ? 'active' : ''}`}
              onClick={() => handleNavigate('products')}
            >
              <Package size={18} />
              <span>Products</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-button ${activeView === 'customers' ? 'active' : ''}`}
              onClick={() => handleNavigate('customers')}
            >
              <Users size={18} />
              <span>Customers</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-button ${activeView === 'orders' ? 'active' : ''}`}
              onClick={() => handleNavigate('orders')}
            >
              <ShoppingCart size={18} />
              <span>Orders</span>
            </button>
          </li>
        </ul>

        {/* Sync Button at bottom of sidebar */}
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={refreshAllData}
          disabled={loading}
          style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: '0.5rem', width: '100%' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
          <span>Sync Data</span>
        </button>
      </nav>

      {/* Main Panel Content Area */}
      <main className="main-content">
        {/* Alerts / Banners */}
        {successMsg && (
          <div className="alert-banner alert-success">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="alert-banner alert-error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dynamic Page Header */}
        <div className="page-header">
          <div className="page-title-section">
            <h1>{pageInfo.title}</h1>
            <p>{pageInfo.desc}</p>
          </div>
        </div>

        {/* Current View content */}
        {renderView()}
      </main>
      
      {/* Dynamic spinning animation helper keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
