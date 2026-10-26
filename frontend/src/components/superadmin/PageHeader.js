import React from 'react';

const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 className="text-2xl font-extrabold">{title}</h2>
      {subtitle && <p className="text-sm text-ink/60">{subtitle}</p>}
    </div>
    {children}
  </div>
);

export default PageHeader;
