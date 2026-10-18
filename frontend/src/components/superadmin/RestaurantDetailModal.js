import React from 'react';
import { Modal, StatTile, Alert, Spinner } from '../ui';
import { useRestaurantDetail } from '../../hooks/useSuperadmin';
import { money, shortDate } from '../../utils/format';
import { statusOf } from '../../constants/orderStatus';
import { TEXT } from '../../constants/text';

const People = ({ title, list }) => (
  <div>
    <h4 className="mb-2 font-bold">{title} ({list.length})</h4>
    {list.length === 0 ? <p className="text-sm text-ink/50">{TEXT.common.none}</p> : list.map((u) => (
      <p key={u._id} className="border-b border-ink/10 py-1 text-sm">{u.username} <span className="text-ink/50">· {u.email}</span></p>
    ))}
  </div>
);

const RestaurantDetailModal = ({ id, onClose }) => {
  const { data, error } = useRestaurantDetail(id);

  return (
    <Modal wide onClose={onClose} title={data?.restaurant.name}
      subtitle={data && `${data.restaurant.email}${data.restaurant.phone ? ` · ${data.restaurant.phone}` : ''} · ${shortDate(data.restaurant.createdAt)}`}>
      <Alert>{error}</Alert>
      {!data && !error && <Spinner />}
      {data && (
        <>
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
