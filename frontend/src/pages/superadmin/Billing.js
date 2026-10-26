import React, { useState, useMemo } from 'react';
import PageHeader from '../../components/superadmin/PageHeader';
import InvoiceForm from '../../components/superadmin/InvoiceForm';
import { StatTile, Badge, Button, Select, TextField, Alert, Spinner, Pagination, useToast, useConfirm } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { api } from '../../services/api';
import { money, periodLabel } from '../../utils/format';
import { TEXT } from '../../constants/text';

const T = TEXT.platform.billing;
const EXTRA_LABELS = TEXT.platform.billing.form.kinds;
const CYCLES = TEXT.platform.billing.form.cycles;
const TONES = { paid: 'success', pending: 'accent', void: 'neutral', overdue: 'primary' };

// The current month and the 5 before it, newest first
const recentPeriods = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    return d.toISOString().slice(0, 7);
  });
};

const InvoiceRow = React.memo(({ i, onSet, busy }) => {
  const shown = i.overdue ? 'overdue' : i.status;
  return (
    <tr className="border-t border-ink/10">
      <td className="px-4 py-3">
        <span className="block font-semibold">{i.restaurant?.name || '—'}</span>
        <span className="block text-xs text-ink/50">{i.restaurant?.adminEmail || i.restaurant?.email || '—'}</span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">{periodLabel(i.period)}</td>
      <td className="px-4 py-3">{money(i.subscriptionFee)}<span className="block text-xs text-ink/50">{i.planName} · {CYCLES[i.cycle || 'monthly']}</span></td>
      <td className="px-4 py-3">
        <span className="font-semibold">{money(i.amount)}</span>{' '}<Badge tone={TONES[shown]}>{T.statuses[shown]}</Badge>
        {i.items?.length > 0 && <span className="block text-xs text-ink/50">{i.items.map((e) => `${e.quantity} ${EXTRA_LABELS[e.kind]}`).join(' · ')}</span>}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        {i.status === 'pending' && <>
          <Button size="sm" variant="soft" disabled={busy} onClick={() => onSet(i, 'paid')}>{T.markPaid}</Button>{' '}
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSet(i, 'void')}>{T.void}</Button>
        </>}
        {i.status !== 'pending' && <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSet(i, 'pending')}>{T.reopen}</Button>}
      </td>
    </tr>
  );
});

const Billing = () => {
  const [status, setStatus] = useState('');
  const [period, setPeriod] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const debounced = useDebouncedValue(search);
  const params = useMemo(() => ({ ...(status && { status }), ...(period && { period }), ...(debounced && { search: debounced }) }), [status, period, debounced]);
  const summary = useFetch(() => api.getBillingSummary(), []);
  const invoices = usePaginatedList(api.getInvoices, { limit: 10, params });
  const action = useAsyncAction();
  const toast = useToast();
  const confirm = useConfirm();
  const periods = recentPeriods();
  const s = summary.data;

  const refresh = () => { summary.reload(); invoices.reload(); };
  const setInvoice = async (invoice, next) => {
    if (next === 'void' && !await confirm({ title: T.void, message: T.voidConfirm(invoice.restaurant?.name), confirmLabel: T.void, danger: true })) return;
    action.run(async () => { await api.updateInvoice(invoice._id, { status: next }); toast.success(TEXT.toast.invoiceStatus(T.statuses[next].toLowerCase())); refresh(); });
  };

  return (
    <>
      <PageHeader title={T.title} subtitle={T.subtitle}>
        <Button onClick={() => setCreating(true)}>{T.createInvoice}</Button>
      </PageHeader>
      <Alert>{summary.error || invoices.error || action.error}</Alert>
      {!s && !summary.error && <div className="py-16 text-center"><Spinner /></div>}
      {s && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label={T.mrr} value={money(s.mrr)} tone="primary" hint={TEXT.platform.pricing.restaurants(s.payingRestaurants)} />
            <StatTile label={T.outstanding} value={money(s.outstanding.amount)} tone="accent" hint={T.invoiceCount(s.outstanding.count)} />
            <StatTile label={T.overdue} value={money(s.overdue.amount)} tone="neutral" hint={T.invoiceCount(s.overdue.count)} />
            <StatTile label={T.collected} value={money(s.collectedAllTime)} tone="success" />
          </div>
        </>
      )}

      <div className="mb-1 grid grid-cols-1 gap-x-4 sm:grid-cols-3">
        <TextField aria-label={T.search} placeholder={T.search} value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label={T.allStatuses} value={status} onChange={(e) => setStatus(e.target.value)}
          options={[{ value: '', label: T.allStatuses }, ...['pending', 'overdue', 'paid', 'void'].map((v) => ({ value: v, label: T.statuses[v] }))]} />
        <Select aria-label={T.allPeriods} value={period} onChange={(e) => setPeriod(e.target.value)}
          options={[{ value: '', label: T.allPeriods }, ...periods.map((p) => ({ value: p, label: periodLabel(p) }))]} />
      </div>
      <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-primary/10 text-ink/70"><tr>{T.columns.map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {invoices.loading && invoices.items.length === 0 && <tr><td colSpan={T.columns.length} className="px-4 py-8 text-center"><Spinner /></td></tr>}
            {!invoices.loading && invoices.items.length === 0 && <tr><td colSpan={T.columns.length} className="px-4 py-8 text-center text-ink/60">{T.empty}</td></tr>}
            {invoices.items.map((i) => <InvoiceRow key={i._id} i={i} onSet={setInvoice} busy={action.loading} />)}
          </tbody>
        </table>
      </div>
      <Pagination pagination={invoices.pagination} onPage={invoices.setPage} disabled={invoices.loading} />
      {creating && <InvoiceForm onClose={() => setCreating(false)} onSaved={refresh} />}
    </>
  );
};

export default Billing;
