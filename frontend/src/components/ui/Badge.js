import React from 'react';

const TONES = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/15 text-accent',
  success: 'bg-success/10 text-success',
  neutral: 'bg-ink/10 text-ink/70',
};

const Badge = ({ tone = 'neutral', children }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>{children}</span>
);

export default React.memo(Badge);
