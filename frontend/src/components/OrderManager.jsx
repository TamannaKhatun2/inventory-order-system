import React, { useState } from 'react';
import { Plus, Trash2, Eye, Search, ShoppingBag, AlertCircle, Calendar } from 'lucide-react';
import Modal from './Modal';
import { api } from '../utils/api';

export default function OrderManager({ orders, products, customers, onRefresh, alertError, alertSuccess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New Order Form States
  const [customerId, setCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);

  // Error and Submitting States
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter orders by customer name or email
  const filteredOrders = orders.filter(
    (o) =>
      o.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toString().includes(searchTerm)
  );

  const resetForm = () => {
    setCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1 }]);
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenDetails = async (orderId) => {
    try {
      const orderDetails = await api.getOrder(orderId);
      setSelectedOrder(orderDetails);
      setIsDetailsOpen(true);
    } catch (err) {
      alertError('Failed to fetch order details: ' + err.message);
    }
  };

  // Add a product item row to order form
  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  // Remove a product item row
  const handleRemoveItemRow = (index) => {
    if (orderItems.length === 1) return; // Must have at least 1 item
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  // Change product or quantity in a row
  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    if (field === 'product_id') {
      newItems[index].product_id = value;
      // Reset quantity or default to 1
      newItems[index].quantity = 1;
    } else if (field === 'quantity') {
      newItems[index].quantity = parseInt(value, 10) || 0;
    }
    setOrderItems(newItems);
  };

  // Calculate live estimate total
  const calculateLiveTotal = () => {
    let total = 0;
    for (const item of orderItems) {
      if (item.product_id) {
        const prod = products.find((p) => p.id === parseInt(item.product_id, 10));
        if (prod) {
          total += prod.price * item.quantity;
        }
      }
    }
    return total;
  };

  // Validate quantities and stocks client-side
  const validateOrder = () => {
    if (!customerId) return 'Please select a customer.';
    
    // Check item rows
    const selectedProductIds = new Set();
    
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item.product_id) {
        return `Row ${i + 1}: Please select a product.`;
      }
      if (selectedProductIds.has(item.product_id)) {
        return 'Duplicate products found. Please combine quantities into a single row.';
      }
      selectedProductIds.add(item.product_id);

      if (item.quantity <= 0) {
        return `Row ${i + 1}: Quantity must be greater than zero.`;
      }

      // Check stock limit
      const product = products.find((p) => p.id === parseInt(item.product_id, 10));
      if (!product) {
        return `Row ${i + 1}: Selected product not found.`;
      }
      if (product.quantity < item.quantity) {
        return `Row ${i + 1}: Insufficient stock for "${product.name}". Available: ${product.quantity}, requested: ${item.quantity}.`;
      }
    }
    return '';
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const validationError = validateOrder();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await api.createOrder({
        customer_id: parseInt(customerId, 10),
        items: orderItems.map((item) => ({
          product_id: parseInt(item.product_id, 10),
          quantity: item.quantity,
        })),
      });
      alertSuccess('Order created and inventory updated successfully!');
      setIsAddOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(err.message || 'Failed to submit order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel/delete this order? Deleting will restore product inventory levels.')) {
      try {
        await api.deleteOrder(orderId);
        alertSuccess('Order canceled and inventory quantities restored!');
        onRefresh();
      } catch (err) {
        alertError('Failed to cancel order: ' + err.message);
      }
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
            placeholder="Search by customer name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Create Order
        </button>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag className="empty-state-icon" />
          <h3>No Orders Recorded</h3>
          <p>Create a sales order. Products, customer records, and inventory limits must be loaded.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Total Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <code style={{ fontWeight: 600, color: 'var(--accent)' }}>#ORD-{order.id}</code>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-pure)' }}>{order.customer?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.customer?.email}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                      <Calendar size={14} style={{ color: 'var(--text-dim)' }} />
                      {formatDate(order.created_at)}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                      ${order.total_amount.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenDetails(order.id)}
                        title="View Details"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteOrder(order.id)}
                        title="Cancel/Delete Order"
                      >
                        <Trash2 size={14} /> Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE ORDER MODAL */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Sales Order"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateOrder} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Submit Order'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateOrder}>
          {formError && (
            <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Select Customer */}
          <div className="form-group">
            <label className="form-label">Customer Account</label>
            <select
              className="form-select"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Order Items Section */}
          <div className="form-group">
            <label className="form-label">Products & Quantities</label>
            <div className="order-items-container">
              {orderItems.map((item, index) => {
                const selectedProd = products.find((p) => p.id === parseInt(item.product_id, 10));
                
                return (
                  <div key={index} className="order-item-row">
                    {/* Select Product */}
                    <select
                      className="form-select"
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      required
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.price.toFixed(2)})
                        </option>
                      ))}
                    </select>

                    {/* Quantity */}
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                    />

                    {/* Remove Action */}
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveItemRow(index)}
                      disabled={orderItems.length === 1}
                      style={{ padding: '0.65rem' }}
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Stock Warning details */}
                    {selectedProd && (
                      <div style={{ gridColumn: 'span 3', fontSize: '0.8rem', color: selectedProd.quantity < item.quantity ? 'var(--danger)' : 'var(--text-muted)', marginTop: '-0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Available in Stock: <strong>{selectedProd.quantity} units</strong></span>
                        {selectedProd.quantity < item.quantity && (
                          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <AlertCircle size={12} /> Insufficient stock!
                          </strong>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItemRow}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                <Plus size={14} /> Add Another Product Line
              </button>

              <div className="order-items-total-box">
                <span>Calculated Estimated Cost:</span>
                <span style={{ fontSize: '1.2rem', color: 'var(--success)' }}>
                  ${calculateLiveTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* VIEW ORDER DETAILS MODAL */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedOrder ? `Order Details: #ORD-${selectedOrder.id}` : 'Order Details'}
        footer={
          <button className="btn btn-secondary" onClick={() => setIsDetailsOpen(false)}>
            Close
          </button>
        }
      >
        {selectedOrder && (
          <div>
            <div className="order-detail-grid">
              <div className="order-detail-section">
                <h4>Customer Details</h4>
                <p>{selectedOrder.customer?.name}</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {selectedOrder.customer?.email}
                </span>
              </div>
              <div className="order-detail-section">
                <h4>Order Date</h4>
                <p>{formatDate(selectedOrder.created_at)}</p>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', text_transform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Line Items
              </h4>
              <div className="table-wrapper">
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU Code</th>
                      <th>Unit Price</th>
                      <th>Qty</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.product_name || 'Deleted Product'}</td>
                        <td>
                          <code>{item.product_sku || 'N/A'}</code>
                        </td>
                        <td>${(item.product_price || 0).toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-pure)' }}>
                          ${((item.product_price || 0) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'right', fontWeight: 700, padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>
                        Grand Total:
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, padding: '1rem 1.5rem', color: 'var(--success)', fontSize: '1.05rem' }}>
                        ${selectedOrder.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
