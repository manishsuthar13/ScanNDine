import { useState, useEffect, useCallback, useRef } from 'react';
import { errorMessage } from '../utils/errors';

// Loads data from a fetcher returning an axios response; reloads when `deps` change or reload() is called
export const useFetch = (fetcher, deps = []) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const depsKey = JSON.stringify(deps);
  const load = useCallback(() => {
    setLoading(true);
    return fetcherRef.current()
      .then((res) => { setData(res.data); setError(''); })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [depsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);
  return { data, error, loading, reload: load };
};
