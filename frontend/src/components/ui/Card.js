import React from 'react';

const Card = ({ title, action, className = '', children }) => (
  <section className={`rounded-2xl bg-surface p-5 shadow-card sm:p-6 ${className}`}>
    {(title || action) && (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {title && <h3 className="text-lg font-bold">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </section>
);

export default React.memo(Card);
