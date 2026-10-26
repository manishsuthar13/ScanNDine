import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useDebouncedValue } from './useDebouncedValue';

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
