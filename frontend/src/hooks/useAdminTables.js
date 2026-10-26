import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { usePaginatedList } from './usePaginatedList';
import { errorMessage } from '../utils/errors';
import { useToast, useConfirm } from '../components/ui';
import { TEXT } from '../constants/text';

// Tables (paginated) with QR generation/preview, add and delete
export const useAdminTables = () => {
  const tables = usePaginatedList(api.getTables, { limit: 10 });
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

  const guarded = useCallback(async (fn) => {
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  // Errors propagate so the add-table dialog can show them
  const addTable = async (number) => {
    await api.createTable({ number });
    toast.success(TEXT.toast.tableCreated(number));
    tables.reload();
  };

  const deleteTable = async (table) => {
    if (!await confirm({ title: TEXT.admin.tables.confirmDelete(table.number), message: TEXT.common.irreversible, confirmLabel: TEXT.common.delete, danger: true })) return;
    await guarded(async () => {
      await api.deleteTable(table._id);
      toast.success(TEXT.toast.tableDeleted(table.number));
      tables.reload();
    });
  };

  const generate = (table) => {
    setBusyId(table._id);
    return guarded(async () => {
      const res = await api.generateQR(table._id);
      setQr({ qrData: res.data.qrData, qrUrl: res.data.qrUrl, table });
      toast.success(TEXT.toast.qrGenerated(table.number));
      tables.reload({ silent: true });
    }).finally(() => setBusyId(null));
  };

  const show = (table) => {
    if (!table.qrData) {
      setError(TEXT.admin.tables.notGenerated);
      return;
    }
    setQr({ qrData: table.qrData, qrUrl: table.qrUrl, table });
  };

  return { tables, qr, closeQr: () => setQr(null), error, busyId, addTable, deleteTable, generate, show };
};
