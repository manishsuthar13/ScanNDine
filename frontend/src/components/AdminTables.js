import React, { useState } from 'react';
import { useAdminTables } from '../hooks/useAdminTables';
import { Card, Button, Modal, Alert, Pagination, Spinner, TextField } from './ui';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { TEXT } from '../constants/text';

const T = TEXT.admin.tables;

const TableRow = React.memo(({ table, busy, onGenerate, onShow, onDelete }) => (
  <li className="flex flex-col gap-2 border-b border-ink/10 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
    <span>
      <span className="font-semibold">{T.table(table.number)}</span>
      <span className="ml-2 text-sm text-ink/50">{T.slug}: {table.qrSlug}</span>
    </span>
    <span className="flex flex-wrap gap-2">
      <Button size="sm" variant="accent" loading={busy} onClick={() => onGenerate(table)}>{T.generate}</Button>
      <Button size="sm" variant="outline" onClick={() => onShow(table)}>{T.show}</Button>
      <Button size="sm" variant="soft" onClick={() => onDelete(table)}>{T.delete}</Button>
    </span>
  </li>
));

const downloadQr = ({ qrData, table }) => {
  const link = document.createElement('a');
  link.href = qrData;
  link.download = `QR_Table_${table.number}.png`;
  link.click();
};

// Asks for the table number in a dialog (replaces the browser prompt)
const AddTableModal = ({ onAdd, onClose }) => {
  const [number, setNumber] = useState('');
  const [invalid, setInvalid] = useState('');
  const action = useAsyncAction();

  const submit = (e) => {
    e.preventDefault();
    const n = Number(number);
    if (!Number.isInteger(n) || n < 1) { setInvalid(TEXT.validation.required); return; }
    action.run(async () => { await onAdd(n); onClose(); });
  };

  return (
    <Modal title={T.addTable} onClose={onClose}>
      <form onSubmit={submit} noValidate className="mt-4">
        <TextField label={T.numberLabel} type="number" min="1" step="1" autoFocus value={number} error={invalid}
          onChange={(e) => { setNumber(e.target.value); setInvalid(''); }} />
        <Alert>{action.error}</Alert>
        <Button type="submit" fullWidth loading={action.loading}>{T.addTable}</Button>
      </form>
    </Modal>
  );
};

const AdminTables = () => {
  const [adding, setAdding] = useState(false);
  const { tables, qr, closeQr, error, busyId, addTable, deleteTable, generate, show } = useAdminTables();

  return (
    <>
      <h2 className="mb-4 text-2xl font-extrabold">{T.title}</h2>
      <Card title={T.listTitle} action={<Button onClick={() => setAdding(true)}>{T.addTable}</Button>}>
        <Alert>{error || tables.error}</Alert>
        {tables.loading && tables.items.length === 0 ? <Spinner /> : (
          <ul>
            {tables.items.length === 0 && <li className="text-ink/60">{T.empty}</li>}
            {tables.items.map((t) => (
              <TableRow key={t._id} table={t} busy={busyId === t._id} onGenerate={generate} onShow={show} onDelete={deleteTable} />
            ))}
          </ul>
        )}
        <Pagination pagination={tables.pagination} onPage={tables.setPage} disabled={tables.loading} />
      </Card>

      {adding && <AddTableModal onAdd={addTable} onClose={() => setAdding(false)} />}

      {qr && (
        <Modal title={T.qrFor(qr.table.number)} onClose={closeQr}>
          <img src={qr.qrData} alt={T.qrFor(qr.table.number)} className="mb-3 w-full rounded-2xl" />
          <p className="mb-4 break-all text-xs text-ink/60">{T.url}: {qr.qrUrl}</p>
          <Button fullWidth onClick={() => downloadQr(qr)}>{T.download}</Button>
        </Modal>
      )}
    </>
  );
};

export default AdminTables;
