import React, { useState } from 'react';
import PageHeader from '../../components/superadmin/PageHeader';
import { Card, StatTile, BarChart, HBars, DateRangePicker, Alert, Spinner } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../services/api';
import { money } from '../../utils/format';
import { TEXT } from '../../constants/text';

const T = TEXT.platform.analytics;
const PRESETS = ['today', 'month', 'year', 'custom'];
const dayLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
const monthLabel = (m) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' });
const number = (n) => Number(n).toLocaleString('en-IN');
// Dates are UTC, matching the server
const todayIso = () => new Date().toISOString().slice(0, 10);
const rangeFor = (preset) => {
  const today = todayIso();
  if (preset === 'month') return { from: `${today.slice(0, 7)}-01`, to: today };
  if (preset === 'year') return { from: `${today.slice(0, 4)}-01-01`, to: today };
  return { from: today, to: today };
};

const Analytics = () => {
  const [preset, setPreset] = useState('month');
  const [custom, setCustom] = useState(rangeFor('today'));
  const range = preset === 'custom' ? custom : rangeFor(preset);
  const stats = useFetch(() => api.getPlatformAnalytics(range), [range.from, range.to]);
  const d = stats.data;
  const label = (key) => (d.granularity === 'month' ? monthLabel(key) : dayLabel(key));
  const periodHint = d && (d.from === d.to ? dayLabel(d.from) : `${dayLabel(d.from)} – ${dayLabel(d.to)}`);

  return (
    <>
      <PageHeader title={T.title} subtitle={T.subtitle}>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Range">
          {PRESETS.map((r) => (
            <button key={r} type="button" onClick={() => setPreset(r)} aria-pressed={preset === r}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${preset === r ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
              {T.ranges[r]}
            </button>
          ))}
        </div>
      </PageHeader>

      {preset === 'custom' && (
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <DateRangePicker from={custom.from} to={custom.to} max={todayIso()} onChange={setCustom} />
          <p className="text-sm text-ink/60">{T.pickHint}</p>
        </div>
      )}

      <Alert>{stats.error}</Alert>
      {!d && !stats.error && <div className="py-16 text-center"><Spinner /></div>}
      {d && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatTile label={T.totalRestaurants} value={number(d.restaurants.total)} tone="primary" hint={`${d.restaurants.active} ${T.active.toLowerCase()} · ${d.restaurants.suspended} ${T.suspended.toLowerCase()}`} />
            <StatTile label={T.totalUsers} value={number(d.users.total)} tone="accent" hint={T.usersHint(d.users.admins, d.users.staff)} />
            <StatTile label={T.totalPlans} value={number(d.totalPlans)} tone="neutral" />
            <StatTile label={T.feesCollected} value={money(d.platformEarned)} tone="success" hint={periodHint} />
            <StatTile label={T.activeUsers} value={number(d.users.active)} tone="success" />
            <StatTile label={T.lockedUsers} value={number(d.users.locked)} tone="neutral" />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card title={T.feesSeries[d.granularity]} className="lg:col-span-2">
              <BarChart title={T.feesSeries[d.granularity]} data={d.feesSeries.map((s) => ({ label: label(s.date), value: s.amount }))} format={money} />
            </Card>
            <Card title={T.feesByPlan}>
              <HBars empty={T.empty} format={money} rows={d.feesByPlan.map((p) => ({ label: p.name, value: p.amount }))} />
            </Card>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title={T.adminsSeries[d.granularity]}>
              <BarChart title={T.adminsSeries[d.granularity]} data={d.usersSeries.map((s) => ({ label: label(s.date), value: s.admins }))} format={number} />
            </Card>
            <Card title={T.staffSeries[d.granularity]}>
              <BarChart title={T.staffSeries[d.granularity]} data={d.usersSeries.map((s) => ({ label: label(s.date), value: s.staff }))} format={number} />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title={T.plans}>
              <HBars empty={T.empty} rows={d.plans.map((p) => ({ label: p.name, value: p.count }))} />
            </Card>
            <Card title={T.usersByRole}>
              <HBars empty={T.empty} rows={[{ label: T.admins, value: d.users.admins }, { label: T.staff, value: d.users.staff }]} />
            </Card>
          </div>
        </>
      )}
    </>
  );
};

export default Analytics;
