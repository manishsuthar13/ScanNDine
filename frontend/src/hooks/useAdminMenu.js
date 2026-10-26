import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { usePaginatedList } from './usePaginatedList';
import { useAsyncAction } from './useAsyncAction';
import { errorMessage } from '../utils/errors';
import { useToast, useConfirm } from '../components/ui';
import { TEXT } from '../constants/text';

const toFormData = ({ name, description, price, categoryId, availability, image }) => {
  const data = new FormData();
  data.append('name', name);
  data.append('description', description || '');
  data.append('price', price);
  data.append('categoryId', categoryId);
  data.append('availability', availability);
  if (image && typeof image !== 'string') data.append('image', image);
  return data;
};

// Menu management logic: categories, filtered/paginated items, and item create/update/delete
export const useAdminMenu = () => {
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [actionError, setActionError] = useState('');
  const toast = useToast();
  const confirm = useConfirm();
  const categoryAction = useAsyncAction();
  const itemAction = useAsyncAction();

  const params = useMemo(() => ({
    ...(categoryFilter && { categoryId: categoryFilter }),
    ...(availabilityFilter && { availability: availabilityFilter }),
  }), [categoryFilter, availabilityFilter]);
  const items = usePaginatedList(api.getMenuItems, { limit: 12, params });

  const loadCategories = useCallback(() => {
    api.getMenuCategories({ limit: 100 }).then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  const addCategory = (name) => categoryAction.run(async () => {
    await api.createCategory({ name });
    toast.success(TEXT.toast.categoryCreated(name));
    loadCategories();
    return true;
  });

  const addItem = (values) => itemAction.run(async () => {
    await api.createItem(toFormData(values));
    toast.success(TEXT.toast.itemCreated(values.name));
    items.reload();
    return true;
  });

  const updateItem = (id, values) => itemAction.run(async () => {
    await api.updateItem(id, toFormData(values));
    toast.success(TEXT.toast.itemUpdated(values.name));
    items.reload();
    return true;
  });

  const guarded = async (action, success) => {
    setActionError('');
    try {
      await action();
      if (success) toast.success(success);
      items.reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const deleteItem = async (item) => {
    if (!await confirm({ title: TEXT.admin.menu.confirmDelete(item.name), message: TEXT.common.irreversible, confirmLabel: TEXT.common.delete, danger: true })) return;
    await guarded(() => api.deleteItem(item._id), TEXT.toast.itemDeleted(item.name));
  };
  const toggleAvailability = (item) => guarded(() => api.updateItem(item._id, { availability: !item.availability }), TEXT.toast.availability(item.name, !item.availability));

  return {
    categories, items,
    categoryFilter, setCategoryFilter, availabilityFilter, setAvailabilityFilter,
    addCategory, categoryAdding: categoryAction.loading, categoryError: categoryAction.error,
    addItem, updateItem, itemSaving: itemAction.loading, itemError: itemAction.error, setItemError: itemAction.setError,
    deleteItem, toggleAvailability, actionError,
  };
};
