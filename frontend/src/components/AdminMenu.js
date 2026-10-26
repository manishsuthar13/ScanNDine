import React, { useState } from 'react';
import { useAdminMenu } from '../hooks/useAdminMenu';
import CategoryForm from './menuAdmin/CategoryForm';
import ItemForm from './menuAdmin/ItemForm';
import ItemList from './menuAdmin/ItemList';
import { Card, Modal, Alert } from './ui';
import { TEXT } from '../constants/text';

const T = TEXT.admin.menu;
const selectClass = 'rounded-full border border-ink/30 bg-surface px-4 py-2 text-sm';

const AdminMenu = () => {
  const menu = useAdminMenu();
  const [editing, setEditing] = useState(null);

  const saveEdit = async (values) => {
    const ok = await menu.updateItem(editing._id, values);
    if (ok) setEditing(null);
    return ok;
  };

  return (
    <>
      <h2 className="mb-4 text-2xl font-extrabold">{T.title}</h2>
      <CategoryForm onAdd={menu.addCategory} loading={menu.categoryAdding} error={menu.categoryError} />

      <Card title={T.addItem} className="mb-6">
        <ItemForm categories={menu.categories} submitLabel={T.addItem} onSubmit={menu.addItem}
          loading={menu.itemSaving} error={menu.itemError} resetOnSuccess />
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(T.filters).map(([value, label]) => {
            const key = value === 'all' ? '' : value;
            const active = menu.availabilityFilter === key;
            return (
              <button key={value} onClick={() => menu.setAvailabilityFilter(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${active ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                {label}
              </button>
            );
          })}
          <select value={menu.categoryFilter} onChange={(e) => menu.setCategoryFilter(e.target.value)} className={selectClass} aria-label={T.category}>
            <option value="">{T.allCategories}</option>
            {menu.categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <Alert>{menu.actionError || menu.items.error}</Alert>
        <ItemList list={menu.items} onToggle={menu.toggleAvailability} onEdit={setEditing} onDelete={menu.deleteItem} />
      </Card>

      {editing && (
        <Modal title={T.editTitle} onClose={() => { setEditing(null); menu.setItemError(''); }}>
          <ItemForm
            categories={menu.categories}
            initial={{ name: editing.name, description: editing.description || '', price: editing.price, categoryId: editing.categoryId?._id || editing.categoryId, availability: editing.availability, image: null }}
            submitLabel={TEXT.common.save}
            onSubmit={saveEdit}
            loading={menu.itemSaving}
            error={menu.itemError}
          />
        </Modal>
      )}
    </>
  );
};

export default AdminMenu;
