import { useState, useCallback } from 'react';
import { usePaginatedList } from './usePaginatedList';
import { useForm } from './useForm';
import { useAsyncAction } from './useAsyncAction';
import { errorMessage } from '../utils/errors';
import { validateEmail, validateUsername, validatePassword } from '../utils/validators';
import { TEXT } from '../constants/text';

const RULES = { username: validateUsername, email: validateEmail, password: validatePassword };

// Paginated list plus add/remove for one kind of team member (staff or admin)
export const useTeamMembers = ({ list, add, remove }) => {
  const members = usePaginatedList(list, { limit: 8 });
  const form = useForm({ username: '', email: '', password: '' }, RULES);
  const addAction = useAsyncAction();
  const [removeError, setRemoveError] = useState('');

  const submit = useCallback((e) => {
    e.preventDefault();
    if (!form.validateAll()) return;
    addAction.run(async () => {
      await add(form.values);
      form.reset();
      members.reload();
    });
  }, [add, form, addAction, members]);

  const removeMember = useCallback(async (member) => {
    if (!window.confirm(TEXT.common.confirmRemove(member.username))) return;
    setRemoveError('');
    try {
      await remove(member._id);
      members.reload();
    } catch (err) {
      setRemoveError(errorMessage(err));
    }
  }, [remove, members]);

  return { members, form, submit, adding: addAction.loading, error: addAction.error || removeError, removeMember };
};
