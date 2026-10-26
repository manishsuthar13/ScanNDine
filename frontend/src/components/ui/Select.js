import React from 'react';

// Native select styled like TextField. `options` are { value, label }.
const Select = ({ label, options, className = '', id, ...rest }) => {
  const fieldId = id || `select-${label || rest['aria-label']}`.replace(/\W+/g, '-').toLowerCase();
  return (
    <div className={`mb-4 ${className}`}>
      {label && <label htmlFor={fieldId} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">{label}</label>}
      <select id={fieldId} className="w-full rounded-xl border border-ink/30 bg-surface px-4 py-3 text-sm text-ink focus:border-primary" {...rest}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
};

export default React.memo(Select);
