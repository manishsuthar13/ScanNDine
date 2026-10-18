import React from 'react';

// Pill tabs; scrolls sideways on narrow screens instead of wrapping awkwardly
const TabNav = ({ tabs, active, onChange }) => (
  <nav className="flex gap-2 overflow-x-auto px-4 py-4 sm:px-8" aria-label="Sections">
    {Object.entries(tabs).map(([key, label]) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        aria-current={active === key}
        className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${active === key ? 'bg-primary text-white shadow-soft' : 'bg-surface text-ink/70 hover:bg-primary/10'}`}
      >
        {label}
      </button>
    ))}
  </nav>
);

export default React.memo(TabNav);
