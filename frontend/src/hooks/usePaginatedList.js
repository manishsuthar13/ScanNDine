import { useState, useEffect, useCallback, useRef } from 'react';
import { errorMessage } from '../utils/errors';

// Loads one page of a paginated endpoint ({ data, pagination }); changing `params` goes back to page 1.
// `pollMs` quietly refreshes the current page (used by the live order board).
export const usePaginatedList = (fetcher, { limit = 10, params, pollMs } = {}) => {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const paramsKey = JSON.stringify(params || {});

  useEffect(() => { setPage(1); }, [paramsKey]);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetcherRef.current({ ...JSON.parse(paramsKey), page, limit });
      setItems(res.data.data);
      setPagination(res.data.pagination);
      setError('');
      // Deleting the last item of a page leaves it empty: step back
      if (res.data.data.length === 0 && page > 1) setPage(page - 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, limit, paramsKey]);

  useEffect(() => {
    load();
    if (!pollMs) return undefined;
    const interval = setInterval(() => load({ silent: true }), pollMs);
    return () => clearInterval(interval);
  }, [load, pollMs]);

  return { items, setItems, pagination, page, setPage, loading, error, reload: load };
};
