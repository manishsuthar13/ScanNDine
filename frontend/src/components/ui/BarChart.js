import React, { useState } from 'react';

// Single-series vertical bars over an ordered axis (days, months). Hover or focus a column to read its exact value.
// `data` is [{ label, value }]; `format` renders values; `title` names the chart for screen readers.
const BarChart = ({ data, format = String, title, height = 'h-44' }) => {
  const [active, setActive] = useState(null);
  const max = Math.max(...data.map((d) => d.value), 0);
  const shown = active !== null ? data[active] : null;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <figure aria-label={title} className="select-none">
      <figcaption className="mb-2 flex h-5 items-baseline justify-between gap-3 text-xs text-ink/60">
        <span>{shown ? shown.label : title}</span>
        <span className="font-semibold text-ink">{format(shown ? shown.value : total)}{shown ? '' : ' total'}</span>
      </figcaption>
      <div className={`relative flex items-end gap-px border-b border-ink/15 ${height}`} onMouseLeave={() => setActive(null)}>
        {[0.5, 1].map((f) => (
          <div key={f} className="pointer-events-none absolute inset-x-0 border-t border-ink/10" style={{ bottom: `${f * 100}%` }} />
        ))}
        <span className="pointer-events-none absolute left-0 top-0 -translate-y-full text-[10px] text-ink/50">{format(max)}</span>
        {data.map((d, i) => (
          <button
            key={d.label}
            type="button"
            aria-label={`${d.label}: ${format(d.value)}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className="group relative flex h-full min-w-0 flex-1 items-end focus-visible:ring-offset-0"
          >
            <span
              className={`block w-full rounded-t-[3px] ${active === i ? 'bg-primary-dark' : 'bg-primary'}`}
              style={{ height: max ? `${Math.max((d.value / max) * 100, d.value ? 1.5 : 0)}%` : 0 }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink/50">
        <span>{data[0]?.label}</span>
        {data.length > 2 && <span>{data[Math.floor(data.length / 2)].label}</span>}
        <span>{data.length > 1 ? data[data.length - 1].label : ''}</span>
      </div>
    </figure>
  );
};

export default React.memo(BarChart);
