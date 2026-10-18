import axios from 'axios';
import { clearSession, getToken, getRefreshToken, setToken } from './session';

const API_BASE = `${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/v1`;

const http = axios.create({ baseURL: API_BASE });
// Customers never log in, so public calls carry no credentials
const publicHttp = axios.create({ baseURL: `${API_BASE}/public` });

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On an expired access token, refresh once (shared across concurrent requests) and retry
let refreshing = null;
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const isAuthCall = /^\/auth\/(login|refresh|signup|forgot-password|reset-password)/.test(config?.url || '');
    if (response?.status !== 401 || !config || config._retried || isAuthCall || !getRefreshToken()) {
      return Promise.reject(error);
    }
    config._retried = true;
    try {
      refreshing = refreshing || axios
        .post(`${API_BASE}/auth/refresh`, { refreshToken: getRefreshToken() })
        .then((r) => r.data.accessToken)
        .finally(() => { refreshing = null; });
      const token = await refreshing;
      setToken(token);
      config.headers.Authorization = `Bearer ${token}`;
      return http(config);
    } catch (refreshError) {
      clearSession();
      window.location.href = '/';
      return Promise.reject(error);
    }
  }
);

// List endpoints take { page, limit } and return { data, pagination }
export const api = {
  // auth
  login: (data) => http.post('/auth/login', data),
  signup: (data) => http.post('/auth/signup', data),
  forgotPassword: (data) => http.post('/auth/forgot-password', data),
  resetPassword: (data) => http.post('/auth/reset-password', data),
  logout: () => http.post('/auth/logout').catch(() => {}),
  getMe: () => http.get('/auth/me'),
  updateMe: (data) => http.put('/auth/me', data),
  changePassword: (data) => http.put('/auth/password', data),
  sendQuery: (data) => http.post('/auth/queries', data),
  getQueries: (params) => http.get('/auth/queries', { params }),
  deleteQuery: (id) => http.delete(`/auth/queries/${id}`),

  // superadmin
  getSuperadminOverview: () => http.get('/superadmin/overview'),
  getRestaurants: (params) => http.get('/superadmin/restaurants', { params }),
  getRestaurantDetail: (id) => http.get(`/superadmin/restaurants/${id}`),
  createAdminAsSuperadmin: (data) => http.post('/superadmin/admins', data),

  // admin: team
  getStaff: (params) => http.get('/admin/staff', { params }),
  addStaff: (data) => http.post('/admin/staff', data),
  removeStaff: (id) => http.delete(`/admin/staff/${id}`),
  getAdmins: (params) => http.get('/admin/admins', { params }),
  addAdmin: (data) => http.post('/admin/admins', data),
  removeAdmin: (id) => http.delete(`/admin/admins/${id}`),

  // admin: menu and tables
  getMenuCategories: (params) => http.get('/menu/categories', { params }),
  createCategory: (data) => http.post('/menu/categories', data),
  getMenuItems: (params) => http.get('/menu/items', { params }),
  createItem: (data) => http.post('/menu/items', data),
  updateItem: (id, data) => http.put(`/menu/items/${id}`, data),
  deleteItem: (id) => http.delete(`/menu/items/${id}`),
  getTables: (params) => http.get('/tables', { params }),
  createTable: (data) => http.post('/tables', data),
  deleteTable: (id) => http.delete(`/tables/${id}`),
  generateQR: (id) => http.get(`/tables/${id}/qr`),

  // staff and admin: orders
  getOrders: (params) => http.get('/orders', { params }),
  deleteOrder: (id) => http.delete(`/orders/${id}`),
  updateOrderStatus: (id, data) => http.patch(`/orders/${id}/status`, data),
  getAnalytics: () => http.get('/orders/analytics'),

  // customers (public, via the QR code)
  getPublicMenu: (restaurantId) => publicHttp.get(`/restaurants/${restaurantId}/menu`),
  placeOrder: (restaurantId, data) => publicHttp.post(`/restaurants/${restaurantId}/orders`, data),
  getTableOrders: (restaurantId, table) =>
    publicHttp.get(`/restaurants/${restaurantId}/orders`, { params: { table, t: Date.now() } }),
};
