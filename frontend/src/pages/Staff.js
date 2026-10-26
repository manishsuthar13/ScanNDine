import React, { useState } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import AccountModal from '../components/AccountModal';
import OrderCard from '../components/staff/OrderCard';
import OrderDetailsModal from '../components/staff/OrderDetailsModal';
import { Card, Button, Alert, Pagination, Spinner } from '../components/ui';
import { useSessionUser } from '../hooks/useSessionUser';
import { useStaffOrders, useSendQuery } from '../hooks/useStaffOrders';
import { TEXT } from '../constants/text';

const T = TEXT.staff;

const QueryBox = () => {
  const { message, setMessage, send, sent, loading, error } = useSendQuery();
  return (
    <Card title={T.queryTitle} className="mb-6">
      <form onSubmit={send}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={T.queryPlaceholder}
          rows="3"
          className="mb-3 w-full rounded-xl border border-ink/30 bg-surface p-3 text-sm placeholder:text-ink/40"
        />
        <Alert>{error}</Alert>
        {sent && <Alert tone="success">{T.querySent}</Alert>}
        <Button type="submit" loading={loading}>{T.querySend}</Button>
      </form>
    </Card>
  );
};

const Staff = () => {
  const { user, restaurant, setUser, logout, showAccount, openAccount, closeAccount } = useSessionUser();
  const { orders, notice, dismissNotice, actionError, updateStatus, clearOrder } = useStaffOrders();
  const [selectedId, setSelectedId] = useState(null);
  // Resolve from the live list so status changes show immediately
  const selected = orders.items.find((o) => o._id === selectedId);

  return (
    <div className="min-h-screen bg-canvas">
      <DashboardHeader title={TEXT.dashboard.staff} subtitle={restaurant?.name} user={user} onAccount={openAccount} onLogout={logout} />
      {showAccount && <AccountModal user={user} restaurant={restaurant} onClose={closeAccount} onUpdated={setUser} />}

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
        {notice && (
          <div onClick={dismissNotice} className="mb-4 cursor-pointer"><Alert tone="info">{notice}</Alert></div>
        )}
        <QueryBox />

        <Alert>{actionError || orders.error}</Alert>
        {orders.loading && orders.items.length === 0 ? <div className="flex justify-center py-10"><Spinner size="lg" /></div> : (
          <ul className="space-y-3">
            {orders.items.length === 0 && <li className="py-8 text-center text-ink/60">{T.noOrders}</li>}
            {orders.items.map((o) => <OrderCard key={o._id} order={o} onShow={(order) => setSelectedId(order._id)} onClear={clearOrder} />)}
          </ul>
        )}
        <Pagination pagination={orders.pagination} onPage={orders.setPage} disabled={orders.loading} />
      </main>

      {selected && <OrderDetailsModal order={selected} onStatus={updateStatus} onClose={() => setSelectedId(null)} />}
    </div>
  );
};

export default Staff;
