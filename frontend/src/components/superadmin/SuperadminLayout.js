import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import AccountModal from '../AccountModal';
import { Button } from '../ui';
import { useSessionUser } from '../../hooks/useSessionUser';
import { TEXT } from '../../constants/text';

const T = TEXT.platform;

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

const NAV = [
  { to: '/superadmin', end: true, label: T.nav.analytics, icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { to: '/superadmin/restaurants', label: T.nav.restaurants, icon: 'M3 10l1-5h16l1 5M4 10v10h16V10M9 20v-6h6v6' },
  { to: '/superadmin/pricing', label: T.nav.pricing, icon: 'M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01' },
  { to: '/superadmin/billing', label: T.nav.billing, icon: 'M6 2h12v20l-3-2-3 2-3-2-3 2V2zM9 8h6M9 12h6' },
  { to: '/superadmin/settings', label: T.nav.settings, icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 00-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 00-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 002 1.2l.4 2.6h4l.4-2.6a7 7 0 002-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z' },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-primary text-white shadow-soft' : 'text-ink/70 hover:bg-primary/10 hover:text-primary'}`;

// Sidebar shell for every superadmin page; collapses into a drawer on small screens
const SuperadminLayout = () => {
  const { user, setUser, logout, showAccount, openAccount, closeAccount } = useSessionUser();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <div className="flex items-center justify-between bg-surface px-4 py-3 shadow-soft lg:hidden">
        <span className="font-display text-lg font-extrabold text-primary">{TEXT.appName}</span>
        <Button variant="soft" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="superadmin-nav">{T.menu}</Button>
      </div>

      <aside
        id="superadmin-nav"
        className={`${open ? 'block' : 'hidden'} bg-surface px-4 py-5 shadow-soft lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col`}
      >
        <div className="mb-6 hidden px-2 lg:block">
          <p className="font-display text-xl font-extrabold text-primary">{TEXT.appName}</p>
          <p className="text-xs text-ink/50">{TEXT.dashboard.superadmin}</p>
        </div>
        <nav className="flex flex-col gap-1" aria-label={TEXT.dashboard.superadmin}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={linkClass} onClick={() => setOpen(false)}>
              <Icon d={n.icon} />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 flex items-center gap-3 border-t border-ink/10 pt-4 lg:mt-auto">
          <button
            onClick={openAccount}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary font-display font-bold text-white"
            title={TEXT.account.title}
            aria-label={TEXT.account.title}
          >
            {user.username.slice(0, 2).toUpperCase()}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.username}</p>
            <button onClick={logout} className="text-xs font-semibold text-primary">{TEXT.common.logout}</button>
          </div>
        </div>
      </aside>

      {showAccount && <AccountModal user={user} onClose={closeAccount} onUpdated={setUser} />}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-6xl"><Outlet context={{ openAccount }} /></div>
      </main>
    </div>
  );
};

export default SuperadminLayout;
