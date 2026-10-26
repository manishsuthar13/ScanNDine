import { useState, useCallback } from 'react';
import { usePaginatedList } from './usePaginatedList';
import { useForm } from './useForm';
import { useAsyncAction } from './useAsyncAction';
import { errorMessage } from '../utils/errors';
import { validateEmail, validateUsername, validatePassword } from '../utils/validators';
import { useToast, useConfirm } from '../components/ui';
import { TEXT } from '../constants/text';

const RULES = { username: validateUsername, email: validateEmail, password: validatePassword };

// Paginated list plus add/remove for one kind of team member (staff or admin)
export const useTeamMembers = ({ list, add, remove }) => {
  const members = usePaginatedList(list, { limit: 8 });
  const form = useForm({ username: '', email: '', password: '' }, RULES);
  const addAction = useAsyncAction();
  const toast = useToast();
  const confirm = useConfirm();
  const [removeError, setRemoveError] = useState('');

  const submit = useCallback((e) => {
    e.preventDefault();
    if (!form.validateAll()) return;
    addAction.run(async () => {
      await add(form.values);
      toast.success(TEXT.toast.added(form.values.username));
      form.reset();
      members.reload();
    });
  }, [add, form, addAction, members, toast]);

  const removeMember = useCallback(async (member) => {
    if (!await confirm({ title: TEXT.common.confirmRemove(member.username), message: TEXT.common.irreversible, confirmLabel: TEXT.common.remove, danger: true })) return;
    setRemoveError('');
    try {
      await remove(member._id);
      toast.success(TEXT.toast.removed(member.username));
      members.reload();
    } catch (err) {
      setRemoveError(errorMessage(err));
    }
  }, [remove, members, confirm, toast]);

  return { members, form, submit, adding: addAction.loading, error: addAction.error || removeError, removeMember };
};
