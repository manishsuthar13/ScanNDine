import React from 'react';
import { Button } from './ui';
import { TEXT } from '../constants/text';

// Top bar shared by the superadmin, admin and staff dashboards
const DashboardHeader = ({ title, subtitle, user, onAccount, onLogout }) => (
  <header className="flex items-center justify-between gap-3 rounded-b-3xl bg-surface px-4 py-4 shadow-soft sm:px-8">
    <div className="min-w-0">
      <h1 className="truncate text-xl font-extrabold sm:text-2xl">{title}</h1>
      {subtitle && <p className="truncate text-sm text-ink/60">{subtitle}</p>}
    </div>
    <div className="flex shrink-0 items-center gap-3">
      <button
        onClick={onAccount}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary font-display font-bold text-white"
        title={`${user.username} - ${TEXT.account.title}`}
        aria-label={TEXT.account.title}
      >
        {user.username.slice(0, 2).toUpperCase()}
      </button>
      <Button variant="soft" size="sm" onClick={onLogout}>{TEXT.common.logout}</Button>
    </div>
  </header>
);

export default React.memo(DashboardHeader);
