import React from 'react';
import { Modal, Button } from '../ui';
import { STAFF_STATUS_STEPS, statusOf } from '../../constants/orderStatus';
import { TEXT } from '../../constants/text';

const T = TEXT.staff;

// Line items plus one-tap status steps (pending -> preparing -> ready)
const OrderDetailsModal = ({ order, onStatus, onClose }) => (
  <Modal title={T.orderTitle(order.tableId?.number ?? 'N/A')} onClose={onClose}>
    <ul className="my-4">
      {order.items.map((item, i) => (
        <li key={i} className="flex justify-between gap-3 border-b border-ink/10 py-2 text-sm">
          <span className="font-medium">{item.menuItemId?.name}</span>
          <span>{item.qty} × ₹{item.menuItemId?.price} = <strong>₹{item.qty * (item.menuItemId?.price || 0)}</strong></span>
        </li>
      ))}
      <li className="flex justify-between py-3 text-lg font-bold">
        <span>{T.total}</span>
        <span>₹{order.totals}</span>
      </li>
    </ul>
    <div className="flex flex-wrap gap-2">
      {STAFF_STATUS_STEPS.map((step) => (
        <Button key={step} size="sm" variant={order.status === step ? 'primary' : 'outline'} onClick={() => onStatus(order._id, step)}>
          {statusOf(step).label}
        </Button>
      ))}
    </div>
  </Modal>
);

export default OrderDetailsModal;
