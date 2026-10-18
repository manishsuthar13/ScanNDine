import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from './useCart';
import { useAsyncAction } from './useAsyncAction';
import { TEXT } from '../constants/text';

// Customer menu opened from a table QR code: /menu?r=<restaurantId>&table=table-<n>. No login.
export const useCustomerMenu = () => {
  const [params] = useSearchParams();
  const restaurantId = params.get('r');
  const tableSlug = params.get('table');

  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(restaurantId));
  const [loadError, setLoadError] = useState('');
  const [orders, setOrders] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);
  const cart = useCart(restaurantId);
  const order = useAsyncAction();

  useEffect(() => {
    if (!restaurantId) return;
    api.getPublicMenu(restaurantId)
      .then((res) => {
        setRestaurant(res.data.restaurant);
        setCategories(res.data.categories);
        setItems(res.data.items);
      })
      .catch(() => setLoadError(TEXT.customer.notFound))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const fetchOrders = useCallback(async () => {
    if (!restaurantId || !tableSlug) return;
    try {
      const res = await api.getTableOrders(restaurantId, tableSlug);
      setOrders(res.data.data);
    } catch { /* keep showing the last known orders */ }
  }, [restaurantId, tableSlug]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const placeOrder = () => {
    if (cart.cart.length === 0) return undefined;
    if (!tableSlug) { order.setError(TEXT.customer.noTable); return undefined; }
    return order.run(async () => {
      const res = await api.placeOrder(restaurantId, {
        tableId: tableSlug,
        items: cart.cart.map((c) => ({ menuItemId: c._id, qty: c.qty })),
      });
      setLastOrder(res.data);
      cart.clear();
      fetchOrders();
      return true;
    });
  };

  const available = items.filter((i) => i.availability);
  const sections = categories.map((cat) => ({ ...cat, items: available.filter((i) => i.categoryId?._id === cat._id) }));

  return {
    restaurantId, tableSlug, tableNumber: tableSlug ? tableSlug.replace('table-', '') : null,
    restaurant, sections, loading, loadError,
    cart, orders, lastOrder, dismissLastOrder: () => setLastOrder(null),
    placeOrder, placing: order.loading, orderError: order.error, clearOrderError: () => order.setError(''),
  };
};
