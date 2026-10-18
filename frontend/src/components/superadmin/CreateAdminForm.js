import React, { useState } from 'react';
import RestaurantPicker from './RestaurantPicker';
import { Card, Button, TextField, Alert } from '../ui';
import { useForm } from '../../hooks/useForm';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { api } from '../../services/api';
import { validateEmail, validateUsername, validatePassword, validatePhone } from '../../utils/validators';
import { TEXT } from '../../constants/text';

const T = TEXT.superadmin;

// Rules depend on the mode: a new restaurant needs a name, an existing one needs a pick
const makeRules = (isNew) => ({
  username: validateUsername,
  email: validateEmail,
  password: validatePassword,
  phone: isNew ? validatePhone : () => '',
  restaurantName: (v) => (isNew && !v.trim() ? TEXT.validation.required : ''),
});

const CreateAdminForm = ({ onCreated }) => {
  const [isNew, setIsNew] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [pickError, setPickError] = useState('');
  const [success, setSuccess] = useState('');
  const form = useForm({ username: '', email: '', password: '', restaurantName: '', phone: '' }, makeRules(isNew));
  const action = useAsyncAction();

  const switchMode = (next) => { setIsNew(next); setPickError(''); };
  const modeClass = (active) => `rounded-full px-4 py-1.5 text-sm font-semibold ${active ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`;

  const submit = (e) => {
    e.preventDefault();
    setSuccess('');
    const valid = form.validateAll();
    if (!isNew && !restaurant) { setPickError(TEXT.validation.required); return; }
    if (!valid) return;
    action.run(async () => {
      const { username, email, password, restaurantName, phone } = form.values;
      const payload = isNew ? { username, email, password, restaurantName, phone } : { username, email, password, restaurantId: restaurant._id };
      const res = await api.createAdminAsSuperadmin(payload);
      setSuccess(`${res.data.user.username} → ${res.data.restaurant.name}`);
      form.reset();
      setRestaurant(null);
      onCreated();
    });
  };

  return (
    <Card title={T.createTitle} className="mb-8">
      <form onSubmit={submit} noValidate>
        <div className="mb-4 flex gap-2">
          <button type="button" className={modeClass(!isNew)} onClick={() => switchMode(false)}>{T.existing}</button>
          <button type="button" className={modeClass(isNew)} onClick={() => switchMode(true)}>{T.newRestaurant}</button>
        </div>

        {isNew ? (
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <TextField label={T.restaurantName} {...form.bind('restaurantName')} />
            <TextField label={T.phone} type="tel" {...form.bind('phone')} />
          </div>
        ) : (
          <>
            <RestaurantPicker selected={restaurant} onSelect={(r) => { setRestaurant(r); setPickError(''); }} />
            {pickError && <p className="-mt-3 mb-3 text-xs text-primary">{pickError}</p>}
          </>
        )}

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
          <TextField label={TEXT.team.usernamePlaceholder} autoCapitalize="none" {...form.bind('username')} />
          <TextField label={TEXT.team.emailPlaceholder} type="email" {...form.bind('email')} />
          <TextField label={TEXT.team.passwordPlaceholder} type="password" autoComplete="new-password" {...form.bind('password')} />
        </div>
        <Alert>{action.error}</Alert>
        <Alert tone="success">{success}</Alert>
        <Button type="submit" loading={action.loading}>{T.create}</Button>
      </form>
    </Card>
  );
};

export default CreateAdminForm;
