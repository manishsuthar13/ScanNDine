import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { usePaginatedList } from './usePaginatedList';

// Staff queries (paginated, refreshed in the background) and restaurant analytics for the admin landing page
export const useAdminOverview = () => {
  const queries = usePaginatedList(api.getQueries, { limit: 5, pollMs: 15000 });
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    api.getAnalytics().then((res) => setAnalytics(res.data)).catch(() => {});
  }, []);

  const clearQuery = useCallback(async (id) => {
    await api.deleteQuery(id);
    queries.reload();
  }, [queries]);

  const clearPage = useCallback(async () => {
    await Promise.all(queries.items.map((q) => api.deleteQuery(q._id)));
    queries.reload();
  }, [queries]);

  return { queries, analytics, clearQuery, clearPage };
};
