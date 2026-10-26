import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import PageHeader from '../../components/superadmin/PageHeader';
import { Card, TextField, Select, Button, Alert, Spinner, useToast } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { api } from '../../services/api';
import { TEXT } from '../../constants/text';

const T = TEXT.platform.settings;

const Settings = () => {
  const { openAccount } = useOutletContext();
  const settings = useFetch(() => api.getPlatformSettings(), []);
  const plans = useFetch(() => api.getPlans(), []);
  const action = useAsyncAction();
  const [form, setForm] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (settings.data) setForm({ ...settings.data, defaultPlanId: settings.data.defaultPlanId || '' });
  }, [settings.data]);

  const set = (name) => (e) => { setForm((f) => ({ ...f, [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })); };

  const submit = (e) => {
    e.preventDefault();
    action.run(async () => {
      const { allowSignups, defaultPlanId, trialDays, taxPercent, invoiceDueDays, invoicePrefix } = form;
      const res = await api.updatePlatformSettings({
        allowSignups, defaultPlanId: defaultPlanId || undefined, invoicePrefix,
        trialDays: Number(trialDays), taxPercent: Number(taxPercent), invoiceDueDays: Number(invoiceDueDays),
      });
      setForm({ ...res.data, defaultPlanId: res.data.defaultPlanId || '' });
      toast.success(T.saved);
    });
  };

  const planOptions = [{ value: '', label: TEXT.platform.restaurants.noPlan }, ...(plans.data?.data || []).filter((p) => p.active).map((p) => ({ value: p._id, label: p.name }))];

  return (
    <>
      <PageHeader title={T.title} subtitle={T.subtitle} />
      <Alert>{settings.error || plans.error}</Alert>
      {!form && !settings.error && <div className="py-16 text-center"><Spinner /></div>}
      {form && (
        <form onSubmit={submit} noValidate className="grid max-w-3xl gap-6">
          <Card title={T.signups}>
            <label className="mb-1 flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.allowSignups} onChange={set('allowSignups')} />
              {T.allowSignups}
            </label>
            <p className="mb-5 ml-7 text-xs text-ink/50">{T.allowHelp}</p>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Select label={T.defaultPlan} value={form.defaultPlanId} options={planOptions} onChange={set('defaultPlanId')} />
              <TextField label={T.trialDays} type="number" min="0" max="365" hint={T.trialHelp} value={form.trialDays} onChange={set('trialDays')} />
            </div>
          </Card>

          <Card title={T.billing}>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
              <TextField label={T.taxPercent} type="number" min="0" max="100" step="0.1" value={form.taxPercent} onChange={set('taxPercent')} />
              <TextField label={T.dueDays} type="number" min="0" max="90" value={form.invoiceDueDays} onChange={set('invoiceDueDays')} />
              <TextField label={T.prefix} value={form.invoicePrefix} onChange={set('invoicePrefix')} />
            </div>
          </Card>

          <div>
            <Alert>{action.error}</Alert>
            <Button type="submit" loading={action.loading}>{TEXT.common.save}</Button>
          </div>

          <Card title={T.account}>
            <p className="mb-4 text-sm text-ink/60">{T.accountHelp}</p>
            <Button variant="outline" onClick={openAccount}>{T.editAccount}</Button>
          </Card>
        </form>
      )}
    </>
  );
};

export default Settings;
