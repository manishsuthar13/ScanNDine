import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { clearSession, getUser, getRestaurant } from '../services/session';

// Current user/restaurant from the stored session plus account-modal and logout handling for dashboards
export const useSessionUser = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [showAccount, setShowAccount] = useState(false);
  const restaurant = getRestaurant();

  const logout = useCallback(async () => {
    await api.logout();
    clearSession();
    navigate('/');
  }, [navigate]);

  return {
    user, restaurant, setUser, logout,
    showAccount, openAccount: () => setShowAccount(true), closeAccount: () => setShowAccount(false),
  };
};
