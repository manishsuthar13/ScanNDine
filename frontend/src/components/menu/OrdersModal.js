import React from 'react';
import { Modal, Badge } from '../ui';
import { statusOf } from '../../constants/orderStatus';
import { TEXT } from '../../constants/text';

const T = TEXT.customer;

const OrdersModal = ({ orders, onClose }) => (
  <Modal title={T.ordersTitle} onClose={onClose}>
    {orders.length === 0 ? <p className="my-4 text-ink/60">{T.noOrders}</p> : (
      <ul className="my-4">
        {orders.map((o) => {
          const status = statusOf(o.status);
          return (
            <li key={o._id} className="border-b border-ink/10 py-3 text-sm">
              <p className="flex items-center justify-between font-semibold">
                <span>{T.orderId(o._id.slice(-6))}</span>
                <Badge tone={status.tone}>{status.label}</Badge>
              </p>
              <ul className="my-1 text-ink/70">
                {o.items.map((item, i) => <li key={i}>{item.qty}× {item.menuItemId?.name}</li>)}
              </ul>
              <p className="font-semibold">{T.total}: ₹{o.totals}</p>
            </li>
          );
        })}
      </ul>
    )}
  </Modal>
);

export default OrdersModal;
