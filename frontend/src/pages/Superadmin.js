import React, { useState } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import AccountModal from '../components/AccountModal';
import CreateAdminForm from '../components/superadmin/CreateAdminForm';
import RestaurantTable from '../components/superadmin/RestaurantTable';
import RestaurantDetailModal from '../components/superadmin/RestaurantDetailModal';
import { StatTile, Alert, TextField } from '../components/ui';
import { useSessionUser } from '../hooks/useSessionUser';
import { useSuperadmin } from '../hooks/useSuperadmin';
import { money } from '../utils/format';
import { TEXT } from '../constants/text';

const T = TEXT.superadmin;

const Superadmin = () => {
  const { user, setUser, logout, showAccount, openAccount, closeAccount } = useSessionUser();
  const { totals, totalsError, search, setSearch, restaurants, refresh } = useSuperadmin();
  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-screen bg-canvas">
      <DashboardHeader title={TEXT.dashboard.superadmin} subtitle={TEXT.dashboard.superadminSub} user={user} onAccount={openAccount} onLogout={logout} />
      {showAccount && <AccountModal user={user} onClose={closeAccount} onUpdated={setUser} />}
      {selected && <RestaurantDetailModal id={selected} onClose={() => setSelected(null)} />}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        <Alert>{totalsError || restaurants.error}</Alert>
        {totals && (
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatTile label={T.stats.restaurants} value={totals.restaurants} tone="primary" />
            <StatTile label={T.stats.admins} value={totals.admins} tone="accent" />
            <StatTile label={T.stats.staff} value={totals.staff} tone="neutral" />
            <StatTile label={T.stats.orders} value={totals.orders} tone="accent" />
            <StatTile label={T.stats.revenue} value={money(totals.revenue)} tone="success" />
          </div>
        )}

        <CreateAdminForm onCreated={refresh} />

        <TextField className="mb-3 max-w-sm" aria-label={T.searchList} placeholder={T.searchList} value={search} onChange={(e) => setSearch(e.target.value)} />
        <RestaurantTable list={restaurants} onOpen={setSelected} />
        <p className="mt-2 text-xs text-ink/50">{T.footnote}</p>
      </main>
    </div>
  );
};

export default Superadmin;
