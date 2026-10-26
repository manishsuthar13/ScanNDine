import React, { useState, useEffect } from 'react';
import { Modal, TextField, Select, Combobox, Button, Alert, Spinner, useToast } from '../ui';
import { useFetch } from '../../hooks/useFetch';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { api } from '../../services/api';
import { money } from '../../utils/format';
import { TEXT } from '../../constants/text';

const T = TEXT.platform.billing.form;
const KINDS = ['qrs', 'staff', 'dishes'];
const TERM_DAYS = { monthly: 30, annual: 365 };
const DAY_MS = 24 * 60 * 60 * 1000;

// yyyy-mm-dd in the viewer's local time, `days` from today
const dateIn = (days) => {
  const d = new Date(Date.now() + days * DAY_MS);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const round2 = (n) => Math.round(n * 100) / 100;
const cell = 'px-3 py-2 align-middle';
// Plain right-aligned number input for the table: just an underline, not a full box
const cellInput = 'w-full border-0 border-b border-ink/25 bg-transparent px-1 py-1 text-right text-sm focus:border-primary';

// Create an invoice: restaurant, date, then a table of items (the plan, plus QR codes / staff / dishes at a price per unit) and a discount
const InvoiceForm = ({ onClose, onSaved }) => {
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query);
  const restaurants = useFetch(() => api.getRestaurants({ limit: 8, ...(search && { search }) }), [search]);
  const plans = useFetch(() => api.getPlans(), []);
  const [restaurant, setRestaurant] = useState(null);
  const [planId, setPlanId] = useState('');
  const [cycle, setCycle] = useState('monthly');
  const [dueDate, setDueDate] = useState(dateIn(TERM_DAYS.monthly));
  const [items, setItems] = useState(() => Object.fromEntries(KINDS.map((k) => [k, { quantity: '', rate: '' }])));
  const [discount, setDiscount] = useState({ type: 'percent', value: '' });
  const [submitted, setSubmitted] = useState(false);
  const action = useAsyncAction();
  const toast = useToast();

  const planList = (plans.data?.data || []).filter((p) => p.active || p._id === planId);
  const plan = planList.find((p) => p._id === planId);
  const planPrice = plan ? (cycle === 'annual' ? plan.annualPrice : plan.monthlyPrice) : 0;

  // The date can only fall within the cycle's term, so changing the cycle resets it to the end of the term
  useEffect(() => { setDueDate(dateIn(TERM_DAYS[cycle])); }, [cycle]);

  const pickRestaurant = (option) => {
    setRestaurant(option);
    if (option.plan) setPlanId(option.plan._id);
  };
  const setItem = (kind, patch) => setItems((prev) => ({ ...prev, [kind]: { ...prev[kind], ...patch } }));

  const lines = KINDS.filter((k) => items[k].quantity !== '' || items[k].rate !== '').map((kind) => {
    const quantity = Number(items[kind].quantity);
    const rate = items[kind].rate === '' ? NaN : Number(items[kind].rate);
    return { kind, quantity, rate, valid: Number.isInteger(quantity) && quantity >= 1 && rate >= 0, amount: round2(quantity * rate) };
  });
  const subtotal = round2(planPrice + lines.reduce((sum, l) => sum + (l.valid ? l.amount : 0), 0));
  const discountValue = Number(discount.value) || 0;
  const discountAmount = round2(discount.type === 'percent' ? subtotal * discountValue / 100 : discountValue);
  const discountInvalid = discountValue < 0 || (discount.type === 'percent' && discountValue > 100) || discountAmount > subtotal;
  const total = round2(subtotal - (discountInvalid ? 0 : discountAmount));

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!restaurant || !planId || !dueDate || discountInvalid || lines.some((l) => !l.valid)) return;
    action.run(async () => {
      await api.createInvoice({
        restaurantId: restaurant.value, planId, cycle, dueDate,
        items: lines.map(({ kind, quantity, rate }) => ({ kind, quantity, rate })),
        discount: { type: discount.type, value: discountValue },
      });
      toast.success(TEXT.toast.invoiceCreated(restaurant.label));
      onSaved();
      onClose();
    });
  };

  const options = (restaurants.data?.data || []).map((r) => ({ value: r._id, label: r.name, hint: r.admins?.[0]?.email || r.email, plan: r.plan }));
  const required = submitted ? TEXT.validation.required : '';
  return (
    <Modal wide onClose={onClose} title={T.title} subtitle={T.subtitle}>
      {plans.loading && !plans.data ? <div className="py-10 text-center"><Spinner /></div> : (
        <form onSubmit={submit} noValidate className="mt-4">
          <Alert>{restaurants.error || plans.error}</Alert>
          <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-[2fr_1fr]">
            <div>
              <Combobox label={T.restaurant} placeholder={T.restaurantPlaceholder} noResults={restaurants.loading ? '…' : T.noRestaurants}
                options={options} selected={restaurant} onQueryChange={setQuery} onSelect={pickRestaurant} className="!mb-1" />
              <p className="mb-4 min-h-[1rem] text-xs text-primary">{!restaurant && required}</p>
            </div>
            <TextField label={T.date} type="date" min={dateIn(0)} max={dateIn(TERM_DAYS[cycle])} value={dueDate} hint={T.dateHelp(TERM_DAYS[cycle])}
              error={submitted && !dueDate ? TEXT.validation.required : ''} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink/60">{T.itemsTitle}</h4>
          <div className="mb-1 overflow-x-auto rounded-2xl border border-ink/10">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-primary/10 text-ink/70"><tr>{T.columns.map((h, i) => <th key={h} className={`${cell} font-semibold ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
              <tbody>
                <tr className="border-t border-ink/10">
                  <td className={cell}>
                    <Select className="!mb-0" aria-label={T.columns[0]} value={planId} onChange={(e) => setPlanId(e.target.value)}
                      options={[{ value: '', label: T.choosePlan }, ...planList.map((p) => ({ value: p._id, label: p.name }))]} />
                    {submitted && !planId && <span className="block text-xs text-primary">{TEXT.validation.required}</span>}
                  </td>
                  <td className={cell}>
                    <Select className="!mb-0" aria-label={T.columns[1]} value={cycle} onChange={(e) => setCycle(e.target.value)}
                      options={Object.entries(T.cycles).map(([value, label]) => ({ value, label }))} />
                  </td>
                  <td className={`${cell} text-right`}>{money(planPrice)}</td>
                  <td className={`${cell} text-right font-medium`}>{money(planPrice)}</td>
                </tr>
                {KINDS.map((kind) => {
                  const line = lines.find((l) => l.kind === kind);
                  return (
                    <tr key={kind} className="border-t border-ink/10">
                      <td className={`${cell} font-medium`}>{T.kinds[kind]}</td>
                      <td className={cell}>
                        <input className={cellInput} aria-label={`${T.kinds[kind]} ${T.columns[1]}`} type="number" min="1" step="1" placeholder="0" value={items[kind].quantity}
                          aria-invalid={submitted && line && !line.valid} onChange={(e) => setItem(kind, { quantity: e.target.value })} />
                        {submitted && line && !line.valid && <span className="block text-right text-xs text-primary">{T.invalidItem}</span>}
                      </td>
                      <td className={cell}>
                        <input className={cellInput} aria-label={`${T.kinds[kind]} ${T.perUnit}`} type="number" min="0" step="any" placeholder={T.perUnit} value={items[kind].rate}
                          onChange={(e) => setItem(kind, { rate: e.target.value })} />
                      </td>
                      <td className={`${cell} text-right font-medium`}>{money(line?.valid ? line.amount : 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-ink/10">
                  <td colSpan={3} className={`${cell} text-right text-ink/70`}>{T.subtotal}</td>
                  <td className={`${cell} text-right`}>{money(subtotal)}</td>
                </tr>
                <tr className="border-t border-ink/10">
                  <td colSpan={2} className={`${cell} text-right text-ink/70`}>{T.discount}</td>
                  <td className={cell}>
                    <div className="flex gap-2">
                      <Select className="!mb-0 w-20 shrink-0" aria-label={T.discount} value={discount.type} onChange={(e) => setDiscount((d) => ({ ...d, type: e.target.value }))}
                        options={Object.entries(T.discountTypes).map(([value, label]) => ({ value, label }))} />
                      <input className={`${cellInput} min-w-0 flex-1`} aria-label={T.discount} type="number" min="0" step="any" placeholder="0" value={discount.value}
                        aria-invalid={discountInvalid} onChange={(e) => setDiscount((d) => ({ ...d, value: e.target.value }))} />
                    </div>
                  </td>
                  <td className={`${cell} text-right`}>{discountInvalid ? <span className="text-xs text-primary">{T.invalidDiscount}</span> : `− ${money(discountAmount)}`}</td>
                </tr>
                <tr className="border-t border-ink/10 bg-primary/10 text-base font-bold">
                  <td colSpan={3} className={`${cell} text-right`}>{T.total}</td>
                  <td className={`${cell} text-right`}>{money(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mb-4 text-xs text-ink/50">{T.itemsHelp}</p>

          <Alert>{action.error}</Alert>
          <Button type="submit" fullWidth loading={action.loading}>{TEXT.platform.billing.createInvoice}</Button>
        </form>
      )}
    </Modal>
  );
};

export default InvoiceForm;
