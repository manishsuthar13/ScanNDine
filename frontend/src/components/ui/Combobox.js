import React, { useState, useRef, useEffect } from 'react';

// Single-line typeahead. Type to filter (the parent narrows `options` via onQueryChange), click an option to pick it.
// `selected` is the chosen { value, label } or null. Options are { value, label, hint? }.
const Combobox = ({ label, options, selected, onSelect, onQueryChange, placeholder, noResults = 'No matches', className = '', id }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const fieldId = id || `combo-${label}`.replace(/\W+/g, '-').toLowerCase();

  useEffect(() => {
    const onDown = (e) => { if (root.current && !root.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const type = (value) => { setQuery(value); setActive(0); setOpen(true); onQueryChange?.(value); };
  const pick = (option) => { onSelect(option); setQuery(''); onQueryChange?.(''); setOpen(false); };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && open && options[active]) { e.preventDefault(); pick(options[active]); }
    else if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); }
  };

  return (
    <div ref={root} className={`relative mb-4 ${className}`}>
      {label && <label htmlFor={fieldId} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">{label}</label>}
      <input
        id={fieldId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${fieldId}-list`}
        autoComplete="off"
        value={open ? query : (selected?.label || '')}
        placeholder={open && selected ? selected.label : placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => type(e.target.value)}
        onKeyDown={onKeyDown}
        className="w-full rounded-xl border border-ink/30 bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-primary"
      />
      {open && (
        <ul id={`${fieldId}-list`} role="listbox" className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-ink/30 bg-surface py-1 shadow-card">
          {options.length === 0 && <li className="px-4 py-2 text-sm text-ink/50">{noResults}</li>}
          {options.map((o, i) => (
            <li key={o.value} role="option" aria-selected={selected?.value === o.value}
              onMouseDown={(e) => { e.preventDefault(); pick(o); }} onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-baseline justify-between gap-3 px-4 py-2 text-sm ${i === active ? 'bg-primary/10' : ''}`}>
              <span className="truncate font-medium">{o.label}</span>
              {o.hint && <span className="truncate text-xs text-ink/50">{o.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Combobox;
