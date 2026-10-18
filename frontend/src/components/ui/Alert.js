import React from 'react';

const TONES = {
  error: 'bg-primary/10 text-primary-dark',
  success: 'bg-success/10 text-success',
  info: 'bg-accent/10 text-ink',
};

const Alert = ({ tone = 'error', children }) =>
  children ? <p role="alert" className={`mb-4 rounded-xl px-4 py-3 text-sm ${TONES[tone]}`}>{children}</p> : null;

export default React.memo(Alert);
