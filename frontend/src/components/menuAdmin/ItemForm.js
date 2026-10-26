import React from 'react';
import { Button, TextField, Alert } from '../ui';
import { useForm } from '../../hooks/useForm';
import { validateRequired } from '../../utils/validators';
import { TEXT } from '../../constants/text';

const T = TEXT.admin.menu;
const RULES = {
  name: validateRequired,
  categoryId: validateRequired,
  price: (v) => (Number(v) > 0 ? '' : TEXT.validation.required),
};

const selectClass = 'w-full rounded-xl border border-ink/30 bg-surface px-4 py-3 text-sm';

// Used both to add an item and to edit one (pass `initial` and a different submit label)
const ItemForm = ({ categories, initial, submitLabel, onSubmit, loading, error, resetOnSuccess }) => {
  const form = useForm(initial || { name: '', description: '', price: '', categoryId: '', availability: true, image: null }, RULES);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.validateAll()) return;
    if ((await onSubmit(form.values)) && resetOnSuccess) form.reset();
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <TextField label={T.name} {...form.bind('name')} />
        <TextField label={T.price} type="number" min="0" step="0.01" {...form.bind('price')} />
        <TextField label={T.description} className="sm:col-span-2" {...form.bind('description')} />
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">{T.category}</label>
          <select className={selectClass} value={form.values.categoryId} onChange={(e) => form.setValue('categoryId', e.target.value)}>
            <option value="">{T.selectCategory}</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          {form.errors.categoryId && <p className="mt-1 text-xs text-primary">{form.errors.categoryId}</p>}
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">{T.image}</label>
          <input type="file" accept="image/*" onChange={(e) => form.setValue('image', e.target.files[0])} className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:font-semibold file:text-primary" />
        </div>
      </div>
      <Alert>{error}</Alert>
      <Button type="submit" loading={loading}>{submitLabel}</Button>
    </form>
  );
};

export default ItemForm;
