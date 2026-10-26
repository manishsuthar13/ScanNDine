import React from 'react';

// Ranked horizontal bars with the value written on each row. `rows` is [{ label, value, hint? }].
const HBars = ({ rows, format = String, empty }) => {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-ink/50">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 0);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{r.label}{r.hint && <span className="ml-2 text-xs font-normal text-ink/50">{r.hint}</span>}</span>
            <span className="shrink-0 font-semibold">{format(r.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-ink/5">
            <div className="h-2 rounded-full bg-primary" style={{ width: max ? `${Math.max((r.value / max) * 100, 2)}%` : 0 }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

export default React.memo(HBars);
