import { useState, useEffect, useCallback } from 'react';

// Cart kept in localStorage per restaurant so a refresh doesn't lose it
export const useCart = (restaurantId) => {
  const key = `cart:${restaurantId}`;
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(cart)); } catch { /* storage unavailable */ }
  }, [cart, key]);

  const add = useCallback((item) => setCart((prev) => (
    prev.some((c) => c._id === item._id)
      ? prev.map((c) => (c._id === item._id ? { ...c, qty: c.qty + 1 } : c))
      : [...prev, { ...item, qty: 1 }]
  )), []);

  const setQty = useCallback((id, qty) => setCart((prev) => (
    qty <= 0 ? prev.filter((c) => c._id !== id) : prev.map((c) => (c._id === id ? { ...c, qty } : c))
  )), []);

  const clear = useCallback(() => setCart([]), []);
  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const count = cart.reduce((sum, c) => sum + c.qty, 0);

  return { cart, add, setQty, clear, total, count };
};
