import { useState, useCallback } from 'react';
import { errorMessage } from '../utils/errors';

// Wraps an async action with loading + error state so buttons can show a loader and disable themselves
export const useAsyncAction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async (action) => {
    setLoading(true);
    setError('');
    try {
      return await action();
    } catch (err) {
      setError(errorMessage(err));
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error, setError };
};
