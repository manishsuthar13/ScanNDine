import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { Button, TextField, Alert } from '../components/ui';
import { useForgotPasswordForm } from '../hooks/useAuthForms';
import { TEXT } from '../constants/text';

const T = TEXT.auth.forgot;

const ForgotPassword = () => {
  const { form, sent, submit, loading, error } = useForgotPasswordForm();
  const back = <Link to="/" className="font-semibold text-primary">{T.back}</Link>;

  return (
    <AuthLayout title={T.title} subtitle={T.subtitle} footer={back}>
      {sent ? (
        <Alert tone="success">{T.sent}</Alert>
      ) : (
        <form onSubmit={submit} noValidate>
          <TextField
            label={TEXT.auth.login.identifierLabel}
            placeholder={TEXT.auth.login.identifierPlaceholder}
            autoCapitalize="none"
            {...form.bind('identifier')}
          />
          <Alert>{error}</Alert>
          <Button type="submit" size="lg" fullWidth loading={loading}>{loading ? TEXT.common.loading : T.submit}</Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
