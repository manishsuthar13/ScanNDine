import React from 'react';
import Spinner from './Spinner';

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-soft',
  accent: 'bg-accent text-white hover:brightness-95 shadow-soft',
  outline: 'border-2 border-primary text-primary hover:bg-primary/10',
  soft: 'bg-primary/10 text-primary hover:bg-primary/20',
  ghost: 'text-ink/70 hover:bg-ink/5',
};
const SIZES = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5 text-sm', lg: 'px-6 py-3.5 text-base' };

// Pill button. While `loading` it shows a spinner and is disabled, so users can't double-submit.
const Button = ({ variant = 'primary', size = 'md', loading = false, fullWidth = false, className = '', children, disabled, type = 'button', ...rest }) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    {...rest}
  >
    {loading && <Spinner size="sm" tone="current" />}
    {children}
  </button>
);

export default React.memo(Button);
