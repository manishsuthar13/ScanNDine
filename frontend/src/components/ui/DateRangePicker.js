import React, { useState } from 'react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const YEARS_PER_PAGE = 12;
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; // m is 0-based
const monthName = (m, style = 'long') => new Date(Date.UTC(2000, m, 1)).toLocaleDateString(undefined, { month: style, timeZone: 'UTC' });
const nav = 'flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink/70 hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent';
const cell = 'rounded-lg py-2 text-sm font-medium';

// Inline calendar for picking a date range (start click, then end click). Click the title to jump by month, then by year.
// `from` / `to` are ISO dates (YYYY-MM-DD, UTC); dates after `max` are disabled.
const DateRangePicker = ({ from, to, max, onChange }) => {
  const [view, setView] = useState('days');
  const [year, setYear] = useState(Number(to.slice(0, 4)));
  const [month, setMonth] = useState(Number(to.slice(5, 7)) - 1);
  const [anchor, setAnchor] = useState(null); // first click of an unfinished range
  const [yearPage, setYearPage] = useState(0);
  const maxYear = Number(max.slice(0, 4));
  const maxMonth = Number(max.slice(5, 7)) - 1;

  const shiftMonth = (delta) => {
    const next = new Date(Date.UTC(year, month + delta, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth());
  };
  const pick = (day) => {
    if (!anchor) { setAnchor(day); onChange({ from: day, to: day }); return; }
    onChange(day < anchor ? { from: day, to: anchor } : { from: anchor, to: day });
    setAnchor(null);
  };

  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const blanks = Array.from({ length: firstDay });
  const lastYear = maxYear - yearPage * YEARS_PER_PAGE;
  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => lastYear - i).reverse();
  const atMaxMonth = year > maxYear || (year === maxYear && month >= maxMonth);

  return (
    <div className="w-72 rounded-2xl border border-ink/10 bg-surface p-3 shadow-soft" role="group" aria-label="Choose dates">
      <div className="mb-2 flex items-center justify-between">
        {view === 'days' && <button type="button" className={nav} aria-label="Previous month" onClick={() => shiftMonth(-1)}>‹</button>}
        {view === 'months' && <button type="button" className={nav} aria-label="Previous year" onClick={() => setYear(year - 1)}>‹</button>}
        {view === 'years' && <button type="button" className={nav} aria-label="Earlier years" onClick={() => setYearPage(yearPage + 1)}>‹</button>}
        <button type="button" className="rounded-lg px-3 py-1 text-sm font-bold hover:bg-primary/10" aria-live="polite"
          onClick={() => { if (view === 'days') setView('months'); else if (view === 'months') { setYearPage(Math.floor((maxYear - year) / YEARS_PER_PAGE)); setView('years'); } else setView('days'); }}>
          {view === 'days' && `${monthName(month)} ${year}`}
          {view === 'months' && year}
          {view === 'years' && `${years[0]} – ${years[years.length - 1]}`}
        </button>
        {view === 'days' && <button type="button" className={nav} aria-label="Next month" disabled={atMaxMonth} onClick={() => shiftMonth(1)}>›</button>}
        {view === 'months' && <button type="button" className={nav} aria-label="Next year" disabled={year >= maxYear} onClick={() => setYear(year + 1)}>›</button>}
        {view === 'years' && <button type="button" className={nav} aria-label="Later years" disabled={yearPage === 0} onClick={() => setYearPage(yearPage - 1)}>›</button>}
      </div>

      {view === 'days' && (
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAYS.map((w) => <span key={w} className="py-1 text-[11px] font-semibold text-ink/50">{w}</span>)}
          {blanks.map((_, i) => <span key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = iso(year, month, i + 1);
            const edge = day === from || day === to;
            const inside = day > from && day < to;
            return (
              <button key={day} type="button" disabled={day > max} aria-pressed={edge} aria-label={day}
                onClick={() => pick(day)}
                className={`${cell} ${edge ? 'bg-primary text-white' : inside ? 'bg-primary/15 text-primary' : 'hover:bg-primary/10'} ${day === max && !edge ? 'ring-1 ring-primary/40' : ''} disabled:opacity-30 disabled:hover:bg-transparent`}>
                {i + 1}
              </button>
            );
          })}
        </div>
      )}

      {view === 'months' && (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, m) => (
            <button key={m} type="button" disabled={year === maxYear && m > maxMonth} aria-pressed={m === month}
              onClick={() => { setMonth(m); setView('days'); }}
              className={`${cell} py-3 ${m === month ? 'bg-primary text-white' : 'hover:bg-primary/10'} disabled:opacity-30 disabled:hover:bg-transparent`}>
              {monthName(m, 'short')}
            </button>
          ))}
        </div>
      )}

      {view === 'years' && (
        <div className="grid grid-cols-3 gap-2">
          {years.map((y) => (
            <button key={y} type="button" aria-pressed={y === year}
              onClick={() => { setYear(y); if (y === maxYear && month > maxMonth) setMonth(maxMonth); setView('months'); }}
              className={`${cell} py-3 ${y === year ? 'bg-primary text-white' : 'hover:bg-primary/10'}`}>
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(DateRangePicker);
