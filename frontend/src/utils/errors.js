import { TEXT } from '../constants/text';

// Best human-readable message from an axios error
export const errorMessage = (err, fallback = TEXT.common.genericError) =>
  err?.response?.data?.message || (err?.request && !err?.response ? TEXT.common.networkError : fallback);
