import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { saveSession, homeFor } from '../services/session';
import { useForm } from './useForm';
import { useAsyncAction } from './useAsyncAction';
import { TEXT } from '../constants/text';
import {
  validateIdentifier, validateEmail, validateUsername, validatePassword, validatePhone, validateRequired,
} from '../utils/validators';

const LOGIN_RULES = {
  identifier: validateIdentifier,
  password: validateRequired,
};

const SIGNUP_RULES = {
  restaurantName: validateRequired,
  email: validateEmail,
  phone: validatePhone,
  username: validateUsername,
  password: validatePassword,
};

const RESET_RULES = {
  password: validatePassword,
  confirm: (value, all) => (value === all.password ? '' : TEXT.validation.passwordMismatch),
};

const FORGOT_RULES = { identifier: validateIdentifier };

// Log in, store the session and go to the dashboard that matches the user's role
export const useLoginForm = () => {
  const navigate = useNavigate();
  const form = useForm({ identifier: '', password: '' }, LOGIN_RULES);
  const [remember, setRemember] = useState(true);
  const action = useAsyncAction();

  const submit = (e) => {
    e.preventDefault();
    if (!form.validateAll()) return;
    action.run(async () => {
      const res = await api.login({ identifier: form.values.identifier.trim(), password: form.values.password });
      saveSession(res.data, remember);
      navigate(homeFor(res.data.user.role), { replace: true });
    });
  };

  return { form, remember, setRemember, submit, loading: action.loading, error: action.error };
};

// Restaurant signup creates the restaurant plus its first admin, then signs them in
export const useSignupForm = () => {
  const navigate = useNavigate();
  const form = useForm({ restaurantName: '', email: '', phone: '', username: '', password: '' }, SIGNUP_RULES);
  const action = useAsyncAction();

  const submit = (e) => {
    e.preventDefault();
    if (!form.validateAll()) return;
    action.run(async () => {
      const res = await api.signup(form.values);
      saveSession(res.data, true);
      navigate(homeFor(res.data.user.role), { replace: true });
    });
  };

  return { form, submit, loading: action.loading, error: action.error };
};

export const useForgotPasswordForm = () => {
  const form = useForm({ identifier: '' }, FORGOT_RULES);
  const [sent, setSent] = useState(false);
  const action = useAsyncAction();

  const submit = (e) => {
    e.preventDefault();
    if (!form.validateAll()) return;
    action.run(async () => {
      await api.forgotPassword({ identifier: form.values.identifier.trim() });
      setSent(true);
    });
  };

  return { form, sent, submit, loading: action.loading, error: action.error };
};

export const useResetPasswordForm = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const form = useForm({ password: '', confirm: '' }, RESET_RULES);
  const [done, setDone] = useState(false);
  const action = useAsyncAction();

  const submit = (e) => {
    e.preventDefault();
    if (!form.validateAll()) return;
    action.run(async () => {
      await api.resetPassword({ token, password: form.values.password });
      setDone(true);
    });
  };

  return { token, form, done, submit, loading: action.loading, error: action.error };
};
