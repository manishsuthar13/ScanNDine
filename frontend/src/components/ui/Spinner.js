import React from 'react';

const SIZES = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-14 w-14 border-4' };

const Spinner = ({ size = 'md', tone = 'primary' }) => (
  <span
    role="status"
    aria-label="Loading"
    className={`inline-block animate-spin rounded-full border-solid ${SIZES[size]} ${tone === 'current' ? 'border-current' : 'border-primary'} border-t-transparent`}
  />
);

export default React.memo(Spinner);
