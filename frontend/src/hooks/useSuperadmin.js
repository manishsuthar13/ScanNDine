import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { usePaginatedList } from './usePaginatedList';
import { useDebouncedValue } from './useDebouncedValue';
import { errorMessage } from '../utils/errors';

// Platform totals plus a searchable, paginated restaurant list
export const useSuperadmin = () => {
  const [totals, setTotals] = useState(null);
  const [totalsError, setTotalsError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const params = useMemo(() => (debouncedSearch ? { search: debouncedSearch } : {}), [debouncedSearch]);
  const restaurants = usePaginatedList(api.getRestaurants, { limit: 10, params });

  const loadTotals = useCallback(() => {
    api.getSuperadminOverview()
      .then((res) => setTotals(res.data.totals))
      .catch((err) => setTotalsError(errorMessage(err)));
  }, []);
  useEffect(() => { loadTotals(); }, [loadTotals]);

  const refresh = useCallback(() => {
    loadTotals();
    restaurants.reload();
  }, [loadTotals, restaurants]);

  return { totals, totalsError, search, setSearch, restaurants, refresh };
};

export const useRestaurantDetail = (id) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.getRestaurantDetail(id).then((res) => setData(res.data)).catch((err) => setError(errorMessage(err)));
  }, [id]);
  return { data, error };
};

// Search-as-you-type restaurant lookup for the create-admin form
export const useRestaurantSearch = (query) => {
  const debounced = useDebouncedValue(query);
  const [results, setResults] = useState([]);
  useEffect(() => {
    if (!debounced.trim()) { setResults([]); return; }
    api.getRestaurants({ search: debounced, limit: 6 }).then((res) => setResults(res.data.data)).catch(() => setResults([]));
  }, [debounced]);
  return results;
};
