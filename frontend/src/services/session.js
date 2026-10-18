// "Remember me" keeps the session in localStorage; otherwise it ends with the browser tab (sessionStorage).
const KEYS = ['token', 'refreshToken', 'user', 'restaurant'];

const get = (key) => sessionStorage.getItem(key) ?? localStorage.getItem(key);
const parse = (key) => {
  try { return JSON.parse(get(key)); } catch { return null; }
};

export const saveSession = ({ accessToken, refreshToken, user, restaurant }, remember = true) => {
  clearSession();
  const store = remember ? localStorage : sessionStorage;
  store.setItem('token', accessToken);
  store.setItem('refreshToken', refreshToken);
  store.setItem('user', JSON.stringify(user));
  store.setItem('restaurant', JSON.stringify(restaurant));
};

export function clearSession() {
  KEYS.forEach((k) => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
}

export const getToken = () => get('token');
export const getRefreshToken = () => get('refreshToken');

// Writes back to whichever storage currently holds the session
const sessionStore = () => (sessionStorage.getItem('token') ? sessionStorage : localStorage);
export const setToken = (token) => sessionStore().setItem('token', token);
export const updateStoredUser = (user) => sessionStore().setItem('user', JSON.stringify(user));

export const getUser = () => (getToken() ? parse('user') : null);
export const getRestaurant = () => parse('restaurant');

export const homeFor = (role) => ({ superadmin: '/superadmin', admin: '/admin', staff: '/staff' }[role] || '/');
