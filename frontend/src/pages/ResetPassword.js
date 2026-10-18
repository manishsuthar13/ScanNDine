import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import PasswordChecklist from '../components/auth/PasswordChecklist';
import { Button, TextField, Alert } from '../components/ui';
import { useResetPasswordForm } from '../hooks/useAuthForms';
import { TEXT } from '../constants/text';

const T = TEXT.auth.reset;

const ResetPassword = () => {
  const { token, form, done, submit, loading, error } = useResetPasswordForm();

  let content;
  if (!token) {
    content = (
      <>
        <Alert>{T.missingToken}</Alert>
        <Link to="/forgot-password"><Button fullWidth size="lg">{T.requestNew}</Button></Link>
      </>
    );
  } else if (done) {
    content = (
      <>
        <Alert tone="success">{T.done}</Alert>
        <Link to="/"><Button fullWidth size="lg">{T.goLogin}</Button></Link>
      </>
    );
  } else {
    content = (
      <form onSubmit={submit} noValidate>
        <TextField label={T.passwordLabel} type="password" autoComplete="new-password" {...form.bind('password')} />
        <PasswordChecklist value={form.values.password} />
        <TextField label={T.confirmLabel} type="password" autoComplete="new-password" {...form.bind('confirm')} />
        <Alert>{error}</Alert>
        <Button type="submit" size="lg" fullWidth loading={loading}>{loading ? TEXT.common.loading : T.submit}</Button>
      </form>
    );
  }

  return <AuthLayout title={T.title} subtitle={T.subtitle}>{content}</AuthLayout>;
};

export default ResetPassword;
