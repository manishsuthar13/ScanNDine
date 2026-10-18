import { TEXT } from '../constants/text';

// Mirrors the backend rules so users get feedback before submitting.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME = /^[a-zA-Z0-9_.]{3,30}$/;
const PHONE = /^[0-9+()\-\s]{7,20}$/;

export const isEmail = (value) => EMAIL.test(value.trim());
export const isUsername = (value) => USERNAME.test(value.trim());

// "email" when the text has an @ (it must then be a valid email), otherwise "username"
export const detectIdentifierType = (value) => {
  const v = value.trim();
  if (!v) return null;
  return v.includes('@') ? 'email' : 'username';
};

export const validateIdentifier = (value) => {
  const v = value.trim();
  if (!v) return TEXT.validation.required;
  if (detectIdentifierType(v) === 'email') return isEmail(v) ? '' : TEXT.validation.email;
  return isUsername(v) ? '' : TEXT.validation.username;
};

export const validateEmail = (value) => (isEmail(value) ? '' : TEXT.validation.email);
export const validateUsername = (value) => (isUsername(value) ? '' : TEXT.validation.username);
export const validatePhone = (value) => (!value.trim() || PHONE.test(value.trim()) ? '' : TEXT.validation.phone);
export const validateRequired = (value) => (value.trim() ? '' : TEXT.validation.required);

// Each rule with whether it passes, for a live checklist under the password field
export const passwordChecks = (value) => [
  { label: TEXT.validation.passwordLength, ok: value.length >= 8 },
  { label: TEXT.validation.passwordCapital, ok: /[A-Z]/.test(value) },
  { label: TEXT.validation.passwordSpecial, ok: /[^A-Za-z0-9]/.test(value) },
];

export const validatePassword = (value) => {
  const failed = passwordChecks(value).find((c) => !c.ok);
  return failed ? failed.label : '';
};
