import React, { useState } from 'react';
import AdminOverview from '../components/AdminOverview';
import AdminMenu from '../components/AdminMenu';
import AdminTables from '../components/AdminTables';
import AdminTeam from '../components/AdminTeam';
import DashboardHeader from '../components/DashboardHeader';
import TabNav from '../components/TabNav';
import AccountModal from '../components/AccountModal';
import { useSessionUser } from '../hooks/useSessionUser';
import { TEXT } from '../constants/text';

const Admin = () => {
  const [section, setSection] = useState('overview');
  const { user, restaurant, setUser, logout, showAccount, openAccount, closeAccount } = useSessionUser();

  return (
    <div className="min-h-screen bg-canvas">
      <DashboardHeader
        title={restaurant?.name || TEXT.dashboard.admin}
        subtitle={TEXT.dashboard.admin}
        user={user}
        onAccount={openAccount}
        onLogout={logout}
      />
      <TabNav tabs={TEXT.dashboard.tabs} active={section} onChange={setSection} />

      {showAccount && <AccountModal user={user} restaurant={restaurant} onClose={closeAccount} onUpdated={setUser} />}

      <main className="px-4 pb-10 sm:px-8">
        {section === 'overview' && <AdminOverview />}
        {section === 'menu' && <AdminMenu />}
        {section === 'tables' && <AdminTables />}
        {section === 'team' && <AdminTeam currentUserId={user._id} />}
      </main>
    </div>
  );
};

export default Admin;
