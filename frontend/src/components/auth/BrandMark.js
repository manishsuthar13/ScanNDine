import React from 'react';

// Fork-and-plate mark; drawn with currentColor so it follows the surrounding text colour
const BrandMark = ({ className = 'h-10 w-10' }) => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="24" cy="24" r="12" />
    <circle cx="24" cy="24" r="6" />
    <path d="M6 8v9a3 3 0 0 0 3 3v20M12 8v12M42 8c-3 3-4 8-4 12h4v20" />
  </svg>
);

export default React.memo(BrandMark);
