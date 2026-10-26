// Order status -> label and badge tone, shared by staff and customer screens
export const ORDER_STATUS = {
  placed: { label: 'Pending', tone: 'primary' },
  preparing: { label: 'Preparing', tone: 'accent' },
  ready: { label: 'Ready', tone: 'success' },
  served: { label: 'Served', tone: 'neutral' },
  canceled: { label: 'Canceled', tone: 'neutral' },
  cleared: { label: 'Cleared', tone: 'neutral' },
};

export const STAFF_STATUS_STEPS = ['placed', 'preparing', 'ready'];

export const statusOf = (status) => ORDER_STATUS[status] || { label: status, tone: 'neutral' };
