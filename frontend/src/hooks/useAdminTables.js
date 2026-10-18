import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { usePaginatedList } from './usePaginatedList';
import { errorMessage } from '../utils/errors';
import { TEXT } from '../constants/text';

// Tables (paginated) with QR generation/preview, add and delete
export const useAdminTables = () => {
  const tables = usePaginatedList(api.getTables, { limit: 10 });
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const guarded = useCallback(async (fn) => {
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  const addTable = () => {
    const number = window.prompt(TEXT.admin.tables.enterNumber);
    if (!number) return undefined;
    return guarded(async () => {
      await api.createTable({ number: parseInt(number, 10) });
      tables.reload();
    });
  };

  const deleteTable = (table) => {
    if (!window.confirm(TEXT.admin.tables.confirmDelete(table.number))) return undefined;
    return guarded(async () => {
      await api.deleteTable(table._id);
      tables.reload();
    });
  };

  const generate = (table) => {
    setBusyId(table._id);
    return guarded(async () => {
      const res = await api.generateQR(table._id);
      setQr({ qrData: res.data.qrData, qrUrl: res.data.qrUrl, table });
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
