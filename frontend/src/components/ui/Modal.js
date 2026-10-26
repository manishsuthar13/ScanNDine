import React, { useEffect } from 'react';
import Button from './Button';
import { TEXT } from '../../constants/text';

// Centered dialog; Escape or a click on the backdrop closes it
const Modal = ({ title, subtitle, onClose, wide = false, children }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className={`max-h-full w-full overflow-y-auto rounded-3xl bg-surface p-6 shadow-card ${wide ? 'max-w-3xl lg:max-w-none lg:w-[70vw]' : 'max-w-sm'}`}
      >
        {title && <h3 className="text-xl font-bold">{title}</h3>}
        {subtitle && <p className="mb-4 text-sm text-ink/60">{subtitle}</p>}
        {children}
        <Button variant="ghost" fullWidth className="mt-4" onClick={onClose}>{TEXT.common.close}</Button>
      </div>
    </div>
  );
};

export default Modal;
