export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const shortDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
export const percentChange = (current, previous) => (previous ? Math.round(((current - previous) / previous) * 100) : null);
// '2026-09' -> 'Sep 2026'
export const periodLabel = (period) => new Date(`${period}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' });
