export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const shortDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
