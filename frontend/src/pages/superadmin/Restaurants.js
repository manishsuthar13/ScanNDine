import React, { useState, useMemo } from 'react';
import PageHeader from '../../components/superadmin/PageHeader';
import CreateAdminForm from '../../components/superadmin/CreateAdminForm';
import RestaurantTable from '../../components/superadmin/RestaurantTable';
import RestaurantDetailModal from '../../components/superadmin/RestaurantDetailModal';
import { Button, Modal, StatTile, TextField, Select, Alert } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { api } from '../../services/api';
import { TEXT } from '../../constants/text';

const T = TEXT.platform.restaurants;

const Restaurants = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [planId, setPlanId] = useState('');
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const debounced = useDebouncedValue(search);
  const params = useMemo(() => ({ ...(debounced && { search: debounced }), ...(status && { status }), ...(planId && { planId }) }), [debounced, status, planId]);
  const list = usePaginatedList(api.getRestaurants, { limit: 10, params });
  const totals = useFetch(() => api.getSuperadminOverview(), []);
  const plans = useFetch(() => api.getPlans(), []);

  const refresh = () => { totals.reload(); list.reload(); };
  const t = totals.data?.totals;

  return (
    <>
      <PageHeader title={T.title} subtitle={T.subtitle}>
        <Button onClick={() => setAdding(true)}>{T.add}</Button>
      </PageHeader>
      {selected && <RestaurantDetailModal id={selected} onClose={() => setSelected(null)} onChanged={refresh} />}
      {adding && (
        <Modal wide onClose={() => setAdding(false)}>
          <CreateAdminForm onCreated={refresh} />
        </Modal>
      )}

      <Alert>{totals.error || list.error}</Alert>
      {t && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatTile label={T.stats.restaurants} value={t.restaurants} tone="primary" />
          <StatTile label={T.stats.admins} value={t.admins} tone="accent" />
          <StatTile label={T.stats.staff} value={t.staff} tone="neutral" />
          <StatTile label={T.stats.active} value={t.active} tone="success" />
          <StatTile label={T.stats.locked} value={t.locked} tone="neutral" />
        </div>
      )}

      <div className="mb-1 grid grid-cols-1 gap-x-4 sm:grid-cols-3">
        <TextField aria-label={T.search} placeholder={T.search} value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label={T.allStatuses} value={status} onChange={(e) => setStatus(e.target.value)}
          options={[{ value: '', label: T.allStatuses }, { value: 'active', label: TEXT.platform.analytics.active }, { value: 'suspended', label: TEXT.platform.analytics.suspended }]} />
        <Select aria-label={T.allPlans} value={planId} onChange={(e) => setPlanId(e.target.value)}
          options={[{ value: '', label: T.allPlans }, { value: 'none', label: T.noPlan }, ...(plans.data?.data || []).map((p) => ({ value: p._id, label: p.name }))]} />
      </div>
      <RestaurantTable list={list} onOpen={setSelected} />
    </>
  );
};

export default Restaurants;
