import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Button from './Button';
import { TEXT } from '../../constants/text';

const FeedbackContext = createContext(null);

const TONES = {
  success: 'bg-success text-white',
  error: 'bg-primary-dark text-white',
  info: 'bg-ink text-white',
};
const DURATION = { success: 3500, info: 3500, error: 6000 };

const ConfirmDialog = ({ title, message, confirmLabel, danger, onResult }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onResult(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4" onMouseDown={() => onResult(false)}>
      <div role="alertdialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-card">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="mt-2 text-sm text-ink/70">{message}</p>
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" fullWidth onClick={() => onResult(false)}>{TEXT.common.cancel}</Button>
          <Button variant={danger ? 'outline' : 'primary'} fullWidth autoFocus onClick={() => onResult(true)}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};

// Gives the app toast notifications (useToast) and a promise-based confirmation dialog (useConfirm), replacing the browser's alert/confirm
export const FeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback((tone, message) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((list) => [...list.slice(-3), { id, tone, message }]);
    setTimeout(() => dismiss(id), DURATION[tone]);
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (message) => push('success', message),
    error: (message) => push('error', message),
    info: (message) => push('info', message),
  }), [push]);

  // confirm({ title, message, confirmLabel, danger }) resolves true when confirmed, false when cancelled
  const confirm = useCallback((options) => new Promise((resolve) => setDialog({ ...options, resolve })), []);
  const settle = useCallback((result) => {
    setDialog((current) => { current?.resolve(result); return null; });
  }, []);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);
  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 top-4 z-[70] flex flex-col items-end gap-2 sm:left-auto sm:w-96">
        {toasts.map((t) => (
          <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-card ${TONES[t.tone]}`}>
            <span className="flex-1">{t.message}</span>
            <button type="button" aria-label={TEXT.common.close} onClick={() => dismiss(t.id)} className="text-lg leading-none opacity-70 hover:opacity-100">×</button>
          </div>
        ))}
      </div>
      {dialog && <ConfirmDialog title={dialog.title || TEXT.common.areYouSure} message={dialog.message} confirmLabel={dialog.confirmLabel || TEXT.common.confirm} danger={dialog.danger} onResult={settle} />}
    </FeedbackContext.Provider>
  );
};

const useFeedback = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('FeedbackProvider is missing');
  return ctx;
};

export const useToast = () => useFeedback().toast;
export const useConfirm = () => useFeedback().confirm;
