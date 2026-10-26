import React from 'react';
import { Modal, StatTile, Alert, Spinner, Badge, Button, Select, useToast, useConfirm } from '../ui';
import { useFetch } from '../../hooks/useFetch';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { api } from '../../services/api';
import { money, shortDate, periodLabel } from '../../utils/format';
import { statusOf } from '../../constants/orderStatus';
import { TEXT } from '../../constants/text';

const T = TEXT.platform.restaurants;
const INVOICE_TONE = { paid: 'success', pending: 'accent', void: 'neutral' };

const People = ({ title, list }) => (
  <div>
    <h4 className="mb-2 font-bold">{title} ({list.length})</h4>
    {list.length === 0 ? <p className="text-sm text-ink/50">{TEXT.common.none}</p> : list.map((u) => (
      <p key={u._id} className="border-b border-ink/10 py-1 text-sm">{u.username} <span className="text-ink/50">· {u.email}</span></p>
    ))}
  </div>
);

// Everything about one restaurant, with the superadmin controls (plan, suspend)
const RestaurantDetailModal = ({ id, onClose, onChanged }) => {
  const detail = useFetch(() => api.getRestaurantDetail(id), [id]);
  const plans = useFetch(() => api.getPlans(), []);
  const action = useAsyncAction();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error } = detail;

  const update = (patch) => action.run(async () => {
    await api.updateRestaurant(id, patch);
    await detail.reload();
    onChanged();
    toast.success(TEXT.toast.restaurantUpdated(data.restaurant.name));
  });

  const toggleStatus = async () => {
    const suspending = data.restaurant.status === 'active';
    if (suspending && !await confirm({ title: T.suspend, message: T.suspendConfirm(data.restaurant.name), confirmLabel: T.suspend, danger: true })) return;
    update({ status: suspending ? 'suspended' : 'active' });
  };

  const r = data?.restaurant;
  const planOptions = [{ value: '', label: T.noPlan }, ...(plans.data?.data || []).filter((p) => p.active || p._id === r?.plan?._id).map((p) => ({ value: p._id, label: `${p.name} (${money(p.monthlyPrice)})` }))];

  return (
    <Modal wide onClose={onClose} title={r?.name}
      subtitle={r && `${r.email}${r.phone ? ` · ${r.phone}` : ''} · ${shortDate(r.createdAt)}`}>
      <Alert>{error || action.error}</Alert>
      {!data && !error && <Spinner />}
      {data && (
        <>
          <div className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl bg-canvas p-4">
            <Badge tone={r.status === 'active' ? 'success' : 'primary'}>{r.status === 'active' ? TEXT.platform.analytics.active : TEXT.platform.analytics.suspended}</Badge>
            {r.trialEndsAt && new Date(r.trialEndsAt) > new Date() && <Badge tone="accent">{T.onTrial(shortDate(r.trialEndsAt))}</Badge>}
            <Select className="mb-0 min-w-[14rem] flex-1" label={T.plan} value={r.plan?._id || ''} options={planOptions}
              disabled={action.loading} onChange={(e) => update({ planId: e.target.value || null })} />
            <Button variant={r.status === 'active' ? 'outline' : 'primary'} size="sm" loading={action.loading} onClick={toggleStatus}>
              {r.status === 'active' ? T.suspend : T.reactivate}
            </Button>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label={TEXT.superadmin.stats.revenue} value={money(data.stats.revenue)} tone="success" />
            <StatTile label={TEXT.superadmin.stats.orders} value={data.stats.orders} tone="accent" />
            <StatTile label={TEXT.superadmin.detail.tables} value={data.stats.tables} tone="primary" />
            <StatTile label={TEXT.superadmin.detail.menuItems} value={data.stats.menuItems} tone="neutral" />
          </div>
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <People title={TEXT.superadmin.stats.admins} list={data.admins} />
            <People title={TEXT.superadmin.stats.staff} list={data.staff} />
          </div>

          <h4 className="mb-2 font-bold">{T.invoices}</h4>
          {data.invoices.length === 0 ? <p className="mb-6 text-sm text-ink/50">{T.noInvoices}</p> : (
            <div className="mb-6">
              {data.invoices.map((i) => (
                <p key={i._id} className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 py-1.5 text-sm">
                  <span>{i.number} · {periodLabel(i.period)}</span>
                  <span className="flex items-center gap-3"><Badge tone={INVOICE_TONE[i.status]}>{TEXT.platform.billing.statuses[i.status]}</Badge><span className="font-semibold">{money(i.amount)}</span></span>
                </p>
              ))}
            </div>
          )}

          <h4 className="mb-2 font-bold">{TEXT.superadmin.detail.recent}</h4>
          {data.recentOrders.length === 0 ? <p className="text-sm text-ink/50">{TEXT.superadmin.detail.noOrders}</p> : data.recentOrders.map((o) => (
            <p key={o._id} className="flex justify-between gap-3 border-b border-ink/10 py-1 text-sm">
              <span>{TEXT.staff.table(o.tableId?.number ?? '—')} · {statusOf(o.status).label} · {new Date(o.createdAt).toLocaleString()}</span>
              <span className="font-semibold">{money(o.totals)}</span>
            </p>
          ))}
        </>
      )}
    </Modal>
  );
};

export default RestaurantDetailModal;
