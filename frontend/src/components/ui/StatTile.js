import React from 'react';

const TONES = { primary: 'bg-primary/10', accent: 'bg-accent/15', success: 'bg-success/10', neutral: 'bg-ink/5' };

const StatTile = ({ label, value, tone = 'primary' }) => (
  <div className={`rounded-2xl p-4 ${TONES[tone]}`}>
    <p className="text-sm text-ink/60">{label}</p>
    <p className="font-display text-2xl font-extrabold">{value}</p>
  </div>
);

export default React.memo(StatTile);
