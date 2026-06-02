import React, { useState } from 'react';
import { Plus, Trash2, Search, Users, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import { api } from '../utils/api';

export default function CustomerManager({ customers, onRefresh, alertError, alertSuccess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Submit and form error states
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const validateForm = () => {
    if (!name.trim()) return 'Customer full name is required.';
    if (!email.trim()) return 'Email address is required.';
    
    // Simple Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';
    
    return '';
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await api.createCustomer({
        name,
        email,
        phone: phone.trim() || null,
      });
      alertSuccess('Customer registered successfully!');
      setIsAddOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(err.message || 'Failed to create customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer? All of their order history will be deleted as well.')) {
      try {
        await api.deleteCustomer(customerId);
        alertSuccess('Customer deleted successfully!');
        onRefresh();
      } catch (err) {
        alertError(err.message || 'Failed to delete customer.');
      }
    }
  };

  return (
    <div className="glass-panel">
      {/* Header controls */}
      <div className="table-controls">
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* Customers Table */}
      {filteredCustomers.length === 0 ? (
        <div className="empty-state">
          <Users className="empty-state-icon" />
          <h3>No Customers Registered</h3>
          <p>Register a customer to begin placing inventory sales orders.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-pure)' }}>{customer.name}</div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-main)' }}>{customer.email}</span>
                  </td>
                  <td>{customer.phone || <em style={{ color: 'var(--text-dim)' }}>Not provided</em>}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteCustomer(customer.id)}
                      title="Delete Customer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Customer"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddCustomer} disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register Customer'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddCustomer}>
          {formError && (
            <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Alice Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. alice.j@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. +1 (555) 019-2834"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
