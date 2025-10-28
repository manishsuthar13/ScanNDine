import React, { useState } from 'react';
import { api } from '../services/api';
import {useNavigate} from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [role, setRole] = useState('customer'); // For signup only
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        const res = await api.login({ email: form.email, password: form.password });  // Auto-detect role
        localStorage.setItem('token', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        // Decode token to get role
        const decoded = JSON.parse(atob(res.data.accessToken.split('.')[1]));
        const userRole = decoded.role;
        navigate(userRole === 'admin' ? '/admin' : userRole === 'staff' ? '/staff' : '/menu');
      } else {
        await api.register({ ...form, role });  // Send selected role for signup
        alert('Registered! Please login.');
        setMode('login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">🍽️ Scan & Dine</h1>
        <div className="flex mb-6">
          <button onClick={() => setMode('login')} className={`flex-1 py-2 ${mode === 'login' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}>Login</button>
          <button onClick={() => setMode('signup')} className={`flex-1 py-2 ${mode === 'signup' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}>Signup</button>
        </div>
        {mode === 'signup' && (
          <div className="mb-4">
            <button onClick={() => setRole('customer')} className={`mr-2 px-4 py-2 rounded ${role === 'customer' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}>Customer</button>
            <button onClick={() => setRole('staff')} className={`mr-2 px-4 py-2 rounded ${role === 'staff' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}>Staff</button>
            <button onClick={() => setRole('admin')} className={`px-4 py-2 rounded ${role === 'admin' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}>Admin</button>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-3 border rounded mb-4" required />
          )}
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-3 border rounded mb-4" required />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full p-3 border rounded mb-4" required />
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button type="submit" className="w-full bg-green-500 text-white py-3 rounded hover:bg-green-600">{mode === 'login' ? 'Login' : 'Signup'}</button>
        </form>
        {mode === 'login' && <button onClick={() => navigate('/menu')} className="w-full bg-blue-500 text-white py-3 rounded mt-4 hover:bg-blue-600">Continue as Guest</button>}
      </div>
    </div>
  );
};

export default Auth;