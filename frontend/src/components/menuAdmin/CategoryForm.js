import React, { useState } from 'react';
import { Card, Button, TextField, Alert } from '../ui';
import { TEXT } from '../../constants/text';

const T = TEXT.admin.menu;

const CategoryForm = ({ onAdd, loading, error }) => {
  const [name, setName] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (await onAdd(name.trim())) setName('');
  };

  return (
    <Card title={T.addCategory} className="mb-6">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <TextField className="mb-0 flex-1" aria-label={T.categoryPlaceholder} placeholder={T.categoryPlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" loading={loading}>{T.addCategory}</Button>
      </form>
      <Alert>{error}</Alert>
    </Card>
  );
};

export default React.memo(CategoryForm);
