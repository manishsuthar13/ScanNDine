import React, { useState } from 'react';
import { Modal, TextField, Button, Alert, useToast } from '../ui';
import { useForm } from '../../hooks/useForm';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { api } from '../../services/api';
import { TEXT } from '../../constants/text';

const T = TEXT.platform.pricing;
const price = (v) => (v === '' || Number(v) < 0 || Number.isNaN(Number(v)) ? TEXT.validation.required : '');
// Empty means unlimited; otherwise a whole number of 1 or more
const limit = (v) => (v === '' || (Number.isInteger(Number(v)) && Number(v) >= 1) ? '' : '≥ 1');
const RULES = {
  name: (v) => (v.trim().length < 2 ? TEXT.validation.required : ''),
  monthlyPrice: price,
  annualPrice: price,
  maxQrs: limit,
  maxStaff: limit,
  maxDishes: limit,
};
const checkbox = 'h-4 w-4 shrink-0 accent-primary';

// Create or edit a plan (pass `plan` to edit)
const PlanForm = ({ plan, onClose, onSaved }) => {
  const form = useForm({
    name: plan?.name || '',
    description: plan?.description || '',
    monthlyPrice: plan?.monthlyPrice ?? '',
    annualPrice: plan?.annualPrice ?? '',
    maxQrs: plan?.maxQrs ?? '',
    maxStaff: plan?.maxStaff ?? '',
    maxDishes: plan?.maxDishes ?? '',
  }, RULES);
  const [points, setPoints] = useState(plan?.points?.length ? plan.points : [{ text: '', show: true }]);
  const action = useAsyncAction();
  const toast = useToast();

  const setPoint = (i, patch) => setPoints((list) => list.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const submit = (e) => {
    e.preventDefault();
    if (!form.validateAll()) return;
    action.run(async () => {
      const v = form.values;
      const payload = {
        name: v.name.trim(),
        description: v.description.trim(),
        monthlyPrice: Number(v.monthlyPrice),
        annualPrice: Number(v.annualPrice),
        maxQrs: v.maxQrs === '' ? null : Number(v.maxQrs),
        maxStaff: v.maxStaff === '' ? null : Number(v.maxStaff),
        maxDishes: v.maxDishes === '' ? null : Number(v.maxDishes),
        points: points.map((p) => ({ text: p.text.trim(), show: p.show })).filter((p) => p.text),
      };
      if (plan) await api.updatePlan(plan._id, { ...payload, active: plan.active });
      else await api.createPlan(payload);
      toast.success((plan ? TEXT.toast.planUpdated : TEXT.toast.planCreated)(payload.name));
      onSaved();
      onClose();
    });
  };

  return (
    <Modal wide onClose={onClose} title={plan ? T.editPlan : T.newPlan}>
      <form onSubmit={submit} noValidate className="mt-4">
        <TextField label={T.fields.name} {...form.bind('name')} />
        <TextField label={T.fields.description} {...form.bind('description')} />
        <div className="grid grid-cols-2 gap-x-3">
          <TextField label={T.fields.monthlyPrice} type="number" min="0" {...form.bind('monthlyPrice')} />
          <TextField label={T.fields.annualPrice} type="number" min="0" {...form.bind('annualPrice')} />
        </div>
        <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-3">
          <TextField label={T.fields.maxQrs} type="number" min="1" step="1" placeholder={T.unlimited} {...form.bind('maxQrs')} />
          <TextField label={T.fields.maxStaff} type="number" min="1" step="1" placeholder={T.unlimited} {...form.bind('maxStaff')} />
          <TextField label={T.fields.maxDishes} type="number" min="1" step="1" placeholder={T.unlimited} {...form.bind('maxDishes')} />
        </div>
        <p className="-mt-2 mb-4 text-xs text-ink/50">{T.fields.unlimitedHint}</p>

        <fieldset className="mb-4">
          <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink/60">{T.fields.points}</legend>
          <ul className="space-y-2">
            {points.map((p, i) => (
              <li key={i} className="flex items-center gap-2">
                <input type="checkbox" className={checkbox} checked={p.show} aria-label={T.fields.showPoint} title={T.fields.showPoint} onChange={(e) => setPoint(i, { show: e.target.checked })} />
                <input type="text" value={p.text} maxLength={100} placeholder={T.fields.pointPlaceholder} aria-label={`${T.fields.points} ${i + 1}`} onChange={(e) => setPoint(i, { text: e.target.value })}
                  className="min-w-0 flex-1 rounded-xl border border-ink/30 bg-surface px-3 py-2 text-sm focus:border-primary" />
                <button type="button" aria-label={T.fields.removePoint} className="rounded-full px-2 text-lg text-ink/50 hover:text-ink" onClick={() => setPoints((list) => list.filter((_, idx) => idx !== i))}>×</button>
              </li>
            ))}
          </ul>
          {points.length < 12 && <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={() => setPoints((list) => [...list, { text: '', show: true }])}>+ {T.fields.addPoint}</Button>}
        </fieldset>

        <Alert>{action.error}</Alert>
        <Button type="submit" fullWidth loading={action.loading}>{TEXT.common.save}</Button>
      </form>
    </Modal>
  );
};

export default PlanForm;
