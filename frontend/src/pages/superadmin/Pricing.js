import React, { useState } from 'react';
import PageHeader from '../../components/superadmin/PageHeader';
import PlanForm from '../../components/superadmin/PlanForm';
import { Button, Card, Badge, Alert, Spinner, useToast, useConfirm } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { api } from '../../services/api';
import { money } from '../../utils/format';
import { TEXT } from '../../constants/text';

const T = TEXT.platform.pricing;

const LIMITS = ['maxQrs', 'maxStaff', 'maxDishes'];

const PlanCard = ({ plan, onEdit, onToggle, onDelete, busy }) => (
  <section className={`flex flex-col rounded-2xl bg-surface p-5 shadow-card ${plan.active ? '' : 'opacity-70'}`}>
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <h3 className="text-lg font-bold">{plan.name}</h3>
      {plan.isDefault && <Badge tone="accent">{T.defaultBadge}</Badge>}
      {!plan.active && <Badge>{T.inactiveBadge}</Badge>}
    </div>
    <p className="font-display text-3xl font-extrabold">{money(plan.monthlyPrice)}<span className="ml-1 text-sm font-medium text-ink/50">{T.perMonth}</span></p>
    <p className="mb-3 text-sm text-ink/60">{money(plan.annualPrice)} {T.perYear}</p>
    {plan.description && <p className="mb-3 text-sm">{plan.description}</p>}
    <dl className="mb-3 grid grid-cols-3 gap-2 rounded-xl bg-canvas p-3 text-center text-sm">
      {LIMITS.map((k) => (
        <div key={k}>
          <dt className="text-xs text-ink/60">{T.limits[k]}</dt>
          <dd className="font-semibold">{plan[k] ? Number(plan[k]).toLocaleString('en-IN') : T.unlimited}</dd>
        </div>
      ))}
    </dl>
    <ul className="mb-4 flex-1 space-y-1 text-sm">
      {plan.points.filter((p) => p.show).map((p) => <li key={p.text} className="flex gap-2"><span className="text-success" aria-hidden="true">✓</span>{p.text}</li>)}
    </ul>
    <p className="mb-4 text-sm text-ink/60">{T.restaurants(plan.restaurants)}</p>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="soft" onClick={() => onEdit(plan)} disabled={busy}>{T.editPlan}</Button>
      <Button size="sm" variant="ghost" onClick={() => onToggle(plan)} disabled={busy}>{plan.active ? T.deactivate : T.activate}</Button>
      <Button size="sm" variant="ghost" onClick={() => onDelete(plan)} disabled={busy}>{T.delete}</Button>
    </div>
  </section>
);

const Pricing = () => {
  const plans = useFetch(() => api.getPlans(), []);
  const action = useAsyncAction();
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null); // plan, or {} for a new one

  const list = plans.data?.data || [];

  const toggle = async (plan) => {
    if (plan.active && !await confirm({ title: T.deactivate, message: T.deactivateConfirm(plan.name), confirmLabel: T.deactivate, danger: true })) return;
    action.run(async () => {
      const { _id, restaurants, monthlyRevenue, isDefault, createdAt, updatedAt, __v, ...fields } = plan;
      await api.updatePlan(_id, { ...fields, active: !plan.active });
      await plans.reload();
      toast.success(TEXT.toast.planActive(plan.name, !plan.active));
    });
  };
  const remove = async (plan) => {
    if (!await confirm({ title: T.deleteConfirm(plan.name), message: TEXT.common.irreversible, confirmLabel: TEXT.common.delete, danger: true })) return;
    action.run(async () => { await api.deletePlan(plan._id); await plans.reload(); toast.success(TEXT.toast.deleted(plan.name)); });
  };

  return (
    <>
      <PageHeader title={T.title} subtitle={T.subtitle}>
        <Button onClick={() => setEditing({})}>{T.newPlan}</Button>
      </PageHeader>
      {editing && <PlanForm plan={editing._id ? editing : null} onClose={() => setEditing(null)} onSaved={plans.reload} />}

      <Alert>{plans.error || action.error}</Alert>
      {plans.loading && !plans.data && <div className="py-16 text-center"><Spinner /></div>}
      {plans.data && (
        <>
          {list.length === 0 ? <Card><p className="py-6 text-center text-ink/60">{T.empty}</p></Card> : (
            <div className="grid grid-cols-1 gap-6">
              {list.map((p) => <PlanCard key={p._id} plan={p} busy={action.loading} onEdit={setEditing} onToggle={toggle} onDelete={remove} />)}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Pricing;
