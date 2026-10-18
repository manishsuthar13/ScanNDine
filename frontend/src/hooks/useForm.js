import { useState, useCallback } from 'react';

// Small form state helper. `rules` maps a field name to (value, allValues) => error string ('' when valid).
export const useForm = (initial, rules = {}) => {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
  }, []);

  const validateField = useCallback((name, current) => {
    const message = rules[name] ? rules[name](current[name], current) : '';
    setErrors((prev) => ({ ...prev, [name]: message }));
    return message;
  }, [rules]);

  const validateAll = useCallback(() => {
    const next = {};
    Object.keys(rules).forEach((name) => { next[name] = rules[name](values[name], values); });
    setErrors(next);
    return Object.values(next).every((m) => !m);
  }, [rules, values]);

  const bind = (name) => ({
    value: values[name],
    error: errors[name],
    onChange: (e) => setValue(name, e.target.value),
    onBlur: () => validateField(name, values),
  });

  return { values, errors, setValue, bind, validateAll, reset: () => { setValues(initial); setErrors({}); } };
};
