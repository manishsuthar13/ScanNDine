import React, { useState } from 'react';

// Labelled, rounded input. Password fields get a show/hide toggle. `hint` sits under the field, `error` replaces it.
const TextField = ({ label, error, hint, type = 'text', className = '', id, ...rest }) => {
  const [visible, setVisible] = useState(false);
  const fieldId = id || `field-${label}`.replace(/\W+/g, '-').toLowerCase();
  const isPassword = type === 'password';

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={fieldId}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-surface px-4 py-3 text-sm text-ink shadow-soft placeholder:text-ink/40 focus:border-primary ${error ? 'border-primary' : 'border-ink/15'} ${isPassword ? 'pr-16' : ''}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary"
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error ? <p className="mt-1 text-xs text-primary">{error}</p> : hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  );
};

export default React.memo(TextField);
