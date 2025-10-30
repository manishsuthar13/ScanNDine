import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE
  ? `${process.env.REACT_APP_API_BASE}/api`
  : 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};


export const api = {
  generateQR: (id) => axios.get(`${API_BASE}/tables/${id}/qr`, { headers: getAuthHeaders() }),
  getMenuCategories: () => axios.get(`${API_BASE}/menu/categories`, { headers: getAuthHeaders() }),
  createCategory: (data) => axios.post(`${API_BASE}/menu/categories`, data, { headers: getAuthHeaders() }),
  getMenuItems: () => axios.get(`${API_BASE}/menu/items`, { headers: getAuthHeaders() }),
  createItem: (data) => axios.post(`${API_BASE}/menu/items`, data, { headers: {...getAuthHeaders(), 'Content-Type': 'multipart/form-data'}}),
  updateItem: (id, data) => axios.put(`${API_BASE}/menu/items/${id}`, data, { headers:{ ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }}),
  deleteItem: (id) => axios.delete(`${API_BASE}/menu/items/${id}`, { headers: getAuthHeaders() }),
  getOrders: () => axios.get(`${API_BASE}/orders`, { headers: getAuthHeaders() }),
  deleteOrder: (id) => axios.delete(`${API_BASE}/orders/${id}`, { headers: getAuthHeaders() }),
  updateOrderStatus: (id, data) => axios.patch(`${API_BASE}/orders/${id}/status`, data, { headers: getAuthHeaders() }),
  getAnalytics: () => axios.get(`${API_BASE}/orders/analytics`, { headers: getAuthHeaders() }),
  getTables: () => axios.get(`${API_BASE}/tables`, { headers: getAuthHeaders() }),
  createTable: (data) => axios.post(`${API_BASE}/tables`, data, { headers: getAuthHeaders() }),
  deleteTable: (id) => axios.delete(`${API_BASE}/tables/${id}`, { headers: getAuthHeaders() }),
  register: (data) => axios.post(`${API_BASE}/auth/register`, data),
  login: (data) => axios.post(`${API_BASE}/auth/login`, data),
  logout: () => axios.post(`${API_BASE}/auth/logout`, {}, { headers: getAuthHeaders() }),
  refresh: (data) => axios.post(`${API_BASE}/auth/refresh`, data),
  checkAdminExists: () => axios.get(`${API_BASE}/auth/check-admin`),
  getPendingStaff: () => axios.get(`${API_BASE}/auth/pending-staff`, { headers: getAuthHeaders() }),
  approveStaff: (id) => axios.patch(`${API_BASE}/auth/approve-staff/${id}`, {}, { headers: getAuthHeaders() }),
  rejectStaff: (id) => axios.delete(`${API_BASE}/auth/reject-staff/${id}`, { headers: getAuthHeaders() }),
  addStaff: (data) => axios.post(`${API_BASE}/auth/add-staff`, data, { headers: getAuthHeaders() }),
  removeStaff: (id) => axios.delete(`${API_BASE}/auth/remove-staff/${id}`, { headers: getAuthHeaders() }),
  getOrderById: (id) => axios.get(`${API_BASE}/orders/${id}`),
  placeOrder: (data) => axios.post(`${API_BASE}/orders`, data, { headers: getAuthHeaders() }),
  getStaffDetails: () => axios.get(`${API_BASE}/auth/staff-details`, { headers: getAuthHeaders() }),
  getAllStaff: () => axios.get(`${API_BASE}/auth/all-staff`, { headers: getAuthHeaders() }),
  updateStaffDetails: (data) => axios.put(`${API_BASE}/auth/update-details`, data, { headers: getAuthHeaders() }),
  sendQuery: (data) => axios.post(`${API_BASE}/auth/queries`, data, {headers: getAuthHeaders()}),
  getQueries: () => axios.get(`${API_BASE}/auth/queries`, {headers: getAuthHeaders()}),
  deleteQuery: (id) => axios.delete(`${API_BASE}/auth/queries/${id}`, { headers: getAuthHeaders() }),  // Added for clearing individual queries
  getCustomerOrders: (config = {}) => axios.get(`${API_BASE}/orders/me`, { 
  headers: getAuthHeaders(),
  ...config,
  params: {
    ...config.params,
    timestamp: Date.now() // Add cache-busting
  }
})

};