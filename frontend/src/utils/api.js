const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const config = {
    ...options,
    headers,
  };
  
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  
  try {
    const response = await fetch(url, config);
    
    // Parse json response if possible, else return text
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (!response.ok) {
      // Extract error message from API standard HTTPException detail
      const errorMsg = data?.detail || data || 'An unknown error occurred.';
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Dashboard
  getSummary: () => request('/dashboard/summary'),
  
  // Products
  getProducts: () => request('/products'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (productData) => request('/products', { method: 'POST', body: productData }),
  updateProduct: (id, productData) => request(`/products/${id}`, { method: 'PUT', body: productData }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  
  // Customers
  getCustomers: () => request('/customers'),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (customerData) => request('/customers', { method: 'POST', body: customerData }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
  
  // Orders
  getOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (orderData) => request('/orders', { method: 'POST', body: orderData }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
};
