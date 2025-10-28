import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminOverview from '../components/AdminOverview';
import AdminMenu from '../components/AdminMenu';
import AdminTables from '../components/AdminTables';

const Admin = () => {
  const [section, setSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showAccount, setShowAccount] = useState(false);
  const [adminDetails, setAdminDetails] = useState({ name: 'A' });
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
      return;
    }

    // Fetch admin details to get name for initials
    const fetchAdminDetails = async () => {
      try {
        const { api } = await import('../services/api');
        const res = await api.getStaffDetails();
        setAdminDetails(res.data);
      } catch (err) {
        console.error('Failed to fetch admin details:', err);
      }
    };
    fetchAdminDetails();

    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    const words = name.split(' ');
    if (words.length === 1) return words[0][0].toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex justify-between items-center px-6 py-4 bg-white shadow">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAccount(prev => !prev)}
            className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold"
            title="Account"
          >
            {getInitials(adminDetails.name)}
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="flex space-x-4 px-6 py-3 border-b bg-gray-100">
        <button
          onClick={() => setSection('overview')}
          className={`px-4 py-2 rounded ${
            section === 'overview' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-800'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSection('menu')}
          className={`px-4 py-2 rounded ${
            section === 'menu' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-800'
          }`}
        >
          Menu Management
        </button>
        <button
          onClick={() => setSection('tables')}
          className={`px-4 py-2 rounded ${
            section === 'tables' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-800'
          }`}
        >
          Table - QR
        </button>
      </nav>

      {showAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">Account</h3>
            <p><strong>Name:</strong> {adminDetails.name}</p>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowAccount(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      <main className="p-6">
        {section === 'overview' && <AdminOverview setSection={setSection} hideHeader />}
        {section === 'menu' && <AdminMenu />}
        {section === 'tables' && <AdminTables />}
      </main>
    </div>
  );
};

export default Admin;