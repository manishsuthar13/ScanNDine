import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { Button, TextField, Alert } from '../components/ui';
import { useLoginForm } from '../hooks/useAuthForms';
import { detectIdentifierType } from '../utils/validators';
import { getUser, homeFor } from '../services/session';
import { TEXT } from '../constants/text';

const T = TEXT.auth.login;

// One field takes an email or a username - the type is detected from what's typed
const LoginForm = () => {
  const { form, remember, setRemember, submit, loading, error } = useLoginForm();
  const kind = detectIdentifierType(form.values.identifier);
  const hint = kind === 'email' ? T.hintEmail : kind === 'username' ? T.hintUsername : undefined;

  return (
    <AuthLayout
      title={T.title}
      subtitle={T.subtitle}
      footer={<>{T.noAccount} <Link to="/signup" className="font-semibold text-primary">{T.signupLink}</Link></>}
    >
      <form onSubmit={submit} noValidate>
        <TextField label={T.identifierLabel} placeholder={T.identifierPlaceholder} autoComplete="username" autoCapitalize="none" hint={hint} {...form.bind('identifier')} />
        <TextField label={T.passwordLabel} type="password" placeholder={T.passwordPlaceholder} autoComplete="current-password" {...form.bind('password')} />

        <div className="mb-5 flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-ink/70">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded accent-primary" />
            {T.remember}
          </label>
          <Link to="/forgot-password" className="font-medium text-primary">{T.forgot}</Link>
        </div>

        <Alert>{error}</Alert>
        <Button type="submit" size="lg" fullWidth loading={loading}>{loading ? TEXT.common.loading : T.submit}</Button>
      </form>
      <p className="mt-5 text-center text-xs text-ink/50">{T.staffNote}</p>
    </AuthLayout>
  );
};

const Auth = () => {
  const existing = getUser();
  if (existing) return <Navigate to={homeFor(existing.role)} replace />;
  return <LoginForm />;
};

export default Auth;
