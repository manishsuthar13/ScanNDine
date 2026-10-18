import React from 'react';
import { Button, Badge } from '../ui';
import { statusOf } from '../../constants/orderStatus';
import { TEXT } from '../../constants/text';

const T = TEXT.staff;

const OrderCard = ({ order, onShow, onClear }) => {
  const status = statusOf(order.status);
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-lg font-bold">{T.table(order.tableId?.number ?? 'N/A')}</p>
        <p className="mt-1 text-sm text-ink/60">
          {order.items.length} item(s) · ₹{order.totals} · <Badge tone={status.tone}>{status.label}</Badge>
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onShow(order)}>{T.show}</Button>
        <Button size="sm" variant="soft" onClick={() => onClear(order._id)}>{T.clear}</Button>
      </div>
    </li>
  );
};

export default React.memo(OrderCard);
