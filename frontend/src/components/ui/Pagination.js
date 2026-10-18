import React from 'react';
import Button from './Button';
import { TEXT } from '../../constants/text';

// Prev/next controls for a { page, totalPages } pagination object; hidden when there is one page
const Pagination = ({ pagination, onPage, disabled }) => {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Pagination">
      <Button variant="outline" size="sm" disabled={disabled || page <= 1} onClick={() => onPage(page - 1)}>{TEXT.common.previous}</Button>
      <span className="text-sm text-ink/60">{TEXT.common.pageOf(page, totalPages)}</span>
      <Button variant="outline" size="sm" disabled={disabled || page >= totalPages} onClick={() => onPage(page + 1)}>{TEXT.common.next}</Button>
    </nav>
  );
};

export default React.memo(Pagination);
