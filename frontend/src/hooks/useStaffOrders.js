import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { usePaginatedList } from './usePaginatedList';
import { useAsyncAction } from './useAsyncAction';
import { errorMessage } from '../utils/errors';
import { TEXT } from '../constants/text';

// Live order board for staff: paginated, refreshed every 10s, announces newly placed orders
export const useStaffOrders = () => {
  const orders = usePaginatedList(api.getOrders, { limit: 10, pollMs: 10000 });
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const seen = useRef(null);

  useEffect(() => {
    const placed = orders.items.filter((o) => o.status === 'placed');
    if (seen.current) {
      const fresh = placed.filter((o) => !seen.current.has(o._id));
      if (fresh.length) setNotice(TEXT.staff.newOrders(fresh.map((o) => o.tableId?.number).join(', ')));
    }
    seen.current = new Set([...(seen.current || []), ...placed.map((o) => o._id)]);
  }, [orders.items]);

  const guarded = useCallback(async (fn) => {
    setActionError('');
    try {
      await fn();
      orders.reload({ silent: true });
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }, [orders]);

  const updateStatus = (id, status) => guarded(() => api.updateOrderStatus(id, { status }));
  const clearOrder = (id) => guarded(() => api.deleteOrder(id));

  return { orders, notice, dismissNotice: () => setNotice(''), actionError, updateStatus, clearOrder };
};

export const useSendQuery = () => {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const action = useAsyncAction();

  const send = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(false);
    action.run(async () => {
      await api.sendQuery({ message });
      setMessage('');
      setSent(true);
    });
  };

  return { message, setMessage, send, sent, loading: action.loading, error: action.error };
};
