import React, { useState } from 'react';
import { api } from '../services/api';
import { updateStoredUser } from '../services/session';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useForm } from '../hooks/useForm';
import { Modal, TextField, Button, Alert } from './ui';
import PasswordChecklist from './auth/PasswordChecklist';
import { validateEmail, validateUsername, validatePassword, validateRequired } from '../utils/validators';
import { TEXT } from '../constants/text';

const T = TEXT.account;
const DETAIL_RULES = { username: validateUsername, email: validateEmail };
const PASSWORD_RULES = { currentPassword: validateRequired, newPassword: validatePassword };

// Shared by every role: edit username/email and change password
const AccountModal = ({ user, restaurant, onClose, onUpdated }) => {
  const details = useForm({ username: user.username, email: user.email }, DETAIL_RULES);
  const password = useForm({ currentPassword: '', newPassword: '' }, PASSWORD_RULES);
  const detailsAction = useAsyncAction();
  const passwordAction = useAsyncAction();
  const [notice, setNotice] = useState('');

  const saveDetails = (e) => {
    e.preventDefault();
    setNotice('');
    if (!details.validateAll()) return;
    detailsAction.run(async () => {
      const res = await api.updateMe(details.values);
      updateStoredUser(res.data);
      onUpdated(res.data);
      setNotice(T.detailsSaved);
    });
  };

  const savePassword = (e) => {
    e.preventDefault();
    setNotice('');
    if (!password.validateAll()) return;
    passwordAction.run(async () => {
      await api.changePassword(password.values);
      password.reset();
      setNotice(T.passwordSaved);
    });
  };

  return (
    <Modal title={T.title} subtitle={`${user.role}${restaurant ? ` · ${restaurant.name}` : ''}`} onClose={onClose}>
      <form onSubmit={saveDetails} noValidate>
        <TextField label={T.username} autoCapitalize="none" {...details.bind('username')} />
        <TextField label={T.email} type="email" {...details.bind('email')} />
        <Alert>{detailsAction.error}</Alert>
        <Button type="submit" loading={detailsAction.loading}>{T.saveDetails}</Button>
      </form>

      <form onSubmit={savePassword} noValidate className="mt-6 border-t border-ink/10 pt-5">
        <TextField label={T.currentPassword} type="password" autoComplete="current-password" {...password.bind('currentPassword')} />
        <TextField label={T.newPassword} type="password" autoComplete="new-password" {...password.bind('newPassword')} />
        <PasswordChecklist value={password.values.newPassword} />
        <Alert>{passwordAction.error}</Alert>
        <Button type="submit" variant="accent" loading={passwordAction.loading}>{T.changePassword}</Button>
      </form>

      <Alert tone="success">{notice}</Alert>
    </Modal>
  );
};

export default AccountModal;
