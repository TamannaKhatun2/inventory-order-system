import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Package, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import { api } from '../utils/api';

export default function ProductManager({ products, onRefresh, alertError, alertSuccess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form States
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  
  // Validation / Error states
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Products
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setName('');
    setSku('');
    setPrice('');
    setQuantity('');
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (product) => {
    resetForm();
    setSelectedProduct(product);
    setName(product.name);
    setSku(product.sku);
    setPrice(product.price.toString());
    setQuantity(product.quantity.toString());
    setIsEditOpen(true);
  };

  // Validation function
  const validateForm = () => {
    if (!name.trim()) return 'Product name is required.';
    if (!sku.trim()) return 'SKU code is required.';
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) return 'Price must be a valid number greater than 0.';
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 0) return 'Quantity in stock cannot be negative.';
    return '';
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await api.createProduct({
        name,
        sku,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
      });
      alertSuccess('Product added successfully!');
      setIsAddOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(err.message || 'Failed to create product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await api.updateProduct(selectedProduct.id, {
        name,
        sku,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
      });
      alertSuccess('Product updated successfully!');
      setIsEditOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(err.message || 'Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(productId);
        alertSuccess('Product deleted successfully!');
        onRefresh();
      } catch (err) {
        alertError(err.message || 'Failed to delete product.');
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
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Products table */}
      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <Package className="empty-state-icon" />
          <h3>No Products Found</h3>
          <p>Create a product to populate the catalog and start managing inventory.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>SKU Code</th>
                <th>Price</th>
                <th>Quantity in Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-pure)' }}>{product.name}</div>
                  </td>
                  <td>
                    <code style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{product.sku}</code>
                  </td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.quantity}</td>
                  <td>
                    {product.quantity === 0 ? (
                      <span className="badge badge-danger">Out of Stock</span>
                    ) : product.quantity < 10 ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">In Stock</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(product)}
                        title="Edit Product"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        title="Delete Product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD MODAL */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Product"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddProduct} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Product'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddProduct}>
          {formError && (
            <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Mechanical Keyboard"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">SKU / Unique Code</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. KB-MECH-87"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Initial Stock Quantity</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Product Details"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleEditProduct} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleEditProduct}>
          {formError && (
            <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">SKU / Unique Code</label>
            <input
              type="text"
              className="form-input"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Quantity in Stock</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
