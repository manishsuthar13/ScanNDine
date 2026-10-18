import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import PasswordChecklist from '../components/auth/PasswordChecklist';
import { Button, TextField, Alert } from '../components/ui';
import { useSignupForm } from '../hooks/useAuthForms';
import { getUser, homeFor } from '../services/session';
import { TEXT } from '../constants/text';

const T = TEXT.auth.signup;

const SignupForm = () => {
  const { form, submit, loading, error } = useSignupForm();

  return (
    <AuthLayout
      title={T.title}
      subtitle={T.subtitle}
      footer={<>{T.haveAccount} <Link to="/" className="font-semibold text-primary">{T.loginLink}</Link></>}
    >
      <form onSubmit={submit} noValidate>
        <TextField label={T.restaurantLabel} autoComplete="organization" {...form.bind('restaurantName')} />
        <TextField label={T.emailLabel} type="email" autoComplete="email" {...form.bind('email')} />
        <TextField label={T.phoneLabel} type="tel" autoComplete="tel" {...form.bind('phone')} />
        <TextField label={T.usernameLabel} autoComplete="username" autoCapitalize="none" {...form.bind('username')} />
        <TextField label={T.passwordLabel} type="password" autoComplete="new-password" {...form.bind('password')} />
        <PasswordChecklist value={form.values.password} />

        <Alert>{error}</Alert>
        <Button type="submit" size="lg" fullWidth loading={loading}>{loading ? TEXT.common.loading : T.submit}</Button>
      </form>
    </AuthLayout>
  );
};

const Signup = () => {
  const existing = getUser();
  if (existing) return <Navigate to={homeFor(existing.role)} replace />;
  return <SignupForm />;
};

export default Signup;
