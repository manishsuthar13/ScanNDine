import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AdminOverview = ({ setSection = () => {}, hideHeader = false }) => {
  const [pendingStaff, setPendingStaff] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [clearedNotifications, setClearedNotifications] = useState(() => {
    const saved = localStorage.getItem('clearedNotifications');
    return new Set(saved ? JSON.parse(saved) : []);
  });
  const [seenQueryIds, setSeenQueryIds] = useState(() => {
    const saved = localStorage.getItem('seenQueryIds');
    return new Set(saved ? JSON.parse(saved) : []);
  }); // Persist to prevent duplicates
  const [seenStaffIds, setSeenStaffIds] = useState(() => {
    const saved = localStorage.getItem('seenStaffIds');
    return new Set(saved ? JSON.parse(saved) : []);
  }); // Persist to prevent duplicates

  const [showRequests, setShowRequests] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '' });
  const [queries, setQueries] = useState([]);
  const [showAccount, setShowAccount] = useState(false);
  const [adminDetails, setAdminDetails] = useState({ name: 'Loading...', email: '' });
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const loadData = useCallback(() => {
    const doLoad = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/';
          return;
        }

        // Try refresh token first; if refresh fails, redirect to login
        try {
          const refreshRes = await api.refresh({ refreshToken: localStorage.getItem('refreshToken') });
          if (refreshRes?.data?.accessToken) {
            localStorage.setItem('token', refreshRes.data.accessToken);
          }
        } catch (refreshErr) {
          console.error('Token refresh failed', refreshErr?.response || refreshErr);
          window.location.href = '/';
          return;
        }

        // Fetch resources in parallel, capturing individual failures
        const [
          pendingRes,
          allStaffRes,
          analyticsRes,
          queriesRes,
          staffRes
        ] = await Promise.all([
          api.getPendingStaff().catch(e => ({ __err: e })),
          api.getAllStaff().catch(e => ({ __err: e })),
          api.getAnalytics().catch(e => ({ __err: e })),
          api.getQueries().catch(e => ({ __err: e })),
          api.getStaffDetails().catch(e => ({ __err: e }))
        ]);

        // pending staff handling
        if (pendingRes && pendingRes.__err) {
          console.error('getPendingStaff failed', pendingRes.__err.response || pendingRes.__err);
        } else if (pendingRes) {
          setPendingStaff(pendingRes.data);
          const newStaffRequests = pendingRes.data.filter(s => !seenStaffIds.has(s._id) && !clearedNotifications.has(s._id));
          if (newStaffRequests.length) {
            setNotifications(prev => [...prev, ...newStaffRequests.map(s => ({ id: s._id, message: `New staff request from ${s.name}`, type: 'info' }))]);
            const updatedSeenStaff = new Set([...seenStaffIds, ...newStaffRequests.map(s => s._id)]);
            setSeenStaffIds(updatedSeenStaff);
            localStorage.setItem('seenStaffIds', JSON.stringify([...updatedSeenStaff]));
          }
        }

        // all staff handling
        if (allStaffRes && allStaffRes.__err) {
          console.error('getAllStaff failed', allStaffRes.__err.response || allStaffRes.__err);
        } else if (allStaffRes) {
          setAllStaff(allStaffRes.data);
        }

        // analytics handling
        if (analyticsRes && analyticsRes.__err) {
          console.error('getAnalytics failed', analyticsRes.__err.response || analyticsRes.__err);
        } else if (analyticsRes) {
          setAnalytics(analyticsRes.data);
        }

        // queries handling
        if (queriesRes && queriesRes.__err) {
          console.error('getQueries failed', queriesRes.__err.response || queriesRes.__err);
          if (queriesRes.__err?.response?.status === 403) {
            setNotifications(prev => [...prev, { id: 'err-queries-403', message: 'Cannot load queries: access denied', type: 'error' }]);
          }
        } else if (queriesRes) {
          setQueries(queriesRes.data);
          const newQueries = queriesRes.data.filter(q => !seenQueryIds.has(q._id) && !clearedNotifications.has(q._id));
          if (newQueries.length) {
            setNotifications(prev => [...prev, ...newQueries.map(q => ({ id: q._id, message: `New query from ${q.staffId?.name}: ${q.message}`, type: 'info' }))]);
            const updatedSeenQuery = new Set([...seenQueryIds, ...newQueries.map(q => q._id)]);
            setSeenQueryIds(updatedSeenQuery);
            localStorage.setItem('seenQueryIds', JSON.stringify([...updatedSeenQuery]));
          }
        }

        // admin/staff details handling
        if (staffRes && staffRes.__err) {
          console.error('getStaffDetails failed', staffRes.__err.response || staffRes.__err);
        } else if (staffRes) {
          setAdminDetails(staffRes.data);
          setEditName(staffRes.data.name);
          setEditEmail(staffRes.data.email);
        }
      } catch (fatalErr) {
        console.error('loadData fatal error', fatalErr);
        window.location.href = '/';
      }
    };

    doLoad();
  }, [clearedNotifications, seenQueryIds, seenStaffIds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const approveStaff = (id) => {
    api.approveStaff(id).then(() => {
      setNotifications(prev => [...prev, { id: Date.now(), message: 'Request approved', type: 'success' }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== Date.now())), 3000);
      loadData();
    });
  };

  const rejectStaff = (id) => {
    api.rejectStaff(id).then(() => {
      setNotifications(prev => [...prev, { id: Date.now(), message: 'Request rejected', type: 'error' }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== Date.now())), 3000);
      loadData();
    });
  };

  const addStaff = () => {
    api.addStaff(newStaff).then(() => {
      loadData();
      setNewStaff({ name: '', email: '', password: '' });
    });
  };

  const removeStaff = (id) => {
    api.removeStaff(id).then(() => loadData());
  };

  const clearNotification = (index) => {
    const note = notifications[index];
    const updated = new Set([...clearedNotifications, note.id]);
    setClearedNotifications(updated);
    setNotifications(prev => prev.filter((_, i) => i !== index));
    localStorage.setItem('clearedNotifications', JSON.stringify([...updated]));
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    const updated = new Set([...clearedNotifications, ...allIds]);
    setClearedNotifications(updated);
    setNotifications([]);
    localStorage.setItem('clearedNotifications', JSON.stringify([...updated]));
  };

  const clearQuery = (id) => {
    api.deleteQuery(id).then(() => {
      setQueries(prev => prev.filter(q => q._id !== id));
      setNotifications(prev => prev.filter(n => n.id !== id)); // Also clear from notifications if present
    });
  };

  const clearAllQueries = () => {
    const queryIds = queries.map(q => q._id);
    Promise.all(queryIds.map(id => api.deleteQuery(id))).then(() => {
      setQueries([]);
      setNotifications(prev => prev.filter(n => !queryIds.includes(n.id))); // Clear from notifications
    });
  };

  const getInitials = (name) => {
    if (!name || name === 'Loading...' || name === '') return 'A';
    const words = name.split(' ');
    if (words.length === 1) return words[0][0].toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase();
  };

  return (
    <div>
      {/* Only render header inside this component when hideHeader is false.
          Admin.js provides a central header/nav so we avoid duplicating it. */}
      {!hideHeader && (
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAccount(!showAccount)}
              className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold"
            >
              {getInitials(adminDetails.name)}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/';
              }}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </header>
      )}

      {/* If hideHeader is true, we do not render the local navigation here because Admin.js provides it.
          If you still want these buttons inside this component to also change section, they call setSection prop. */}
      {!hideHeader && (
        <div className="flex space-x-2 border-t border-b py-3 mb-6">
          <button onClick={() => setSection('overview')} className="bg-orange-500 text-white px-4 py-2 rounded">Overview</button>
          <button onClick={() => setSection('menu')} className="bg-gray-200 text-black px-4 py-2 rounded">Menu Management</button>
          <button onClick={() => setSection('tables')} className="bg-gray-200 text-black px-4 py-2 rounded">Table - QR</button>
        </div>
      )}

      {/* If the parent provided setSection and hideHeader=true, we still want nav buttons visible in the parent header;
          but in case other places render AdminOverview without the central header, the component keeps its own nav. */}

      {/* Account Modal */}
      {showAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">Account Details</h3>
            {editing ? (
              <>
                <label className="block mb-2">Name:</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="border p-2 w-full mb-2" />
                <label className="block mb-2">Email:</label>
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="border p-2 w-full mb-2" />
                <button onClick={() => { 
                  api.updateStaffDetails({ name: editName, email: editEmail }).then(() => {
                    setAdminDetails({ ...adminDetails, name: editName, email: editEmail });
                    setEditing(false);
                  }).catch(() => alert('Failed to update'));
                }} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Save</button>
                <button onClick={() => setEditing(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
              </>
            ) : (
              <>
                <p><strong>Name:</strong> {adminDetails.name}</p>
                <p><strong>Email:</strong> {adminDetails.email}</p>
                <button onClick={() => setEditing(true)} className="bg-yellow-500 text-white px-4 py-2 rounded mr-2">Edit</button>
              </>
            )}
            <button onClick={() => setShowAccount(false)} className="bg-gray-500 text-white px-4 py-2 rounded mt-2 ml-2">Close</button>
          </div>
        </div>
      )}

      {/* Notifications Section */}
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>

      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        {notifications.length === 0 ? <p>No notifications.</p> : (
          <>
            {notifications.map((note, index) => (
              <div key={`${note.id}-${index}`} className={`border-b py-2 ${note.type === 'success' ? 'text-green-600' : note.type === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                <span>{note.message}</span>
                <button onClick={() => clearNotification(index)} className="bg-blue-500 text-white px-2 py-1 rounded ml-2">Clear</button>
              </div>
            ))}
            <button onClick={clearAllNotifications} className="bg-gray-500 text-white px-4 py-2 rounded mt-4">Clear All Notifications</button>
          </>
        )}
      </div>

      {/* Rest of the page (unchanged) */}
      <div className="mb-6">
        <button onClick={() => setShowRequests(!showRequests)} className="bg-purple-500 text-white px-6 py-2 rounded">View All Requests</button>
        {showRequests && (
          <div className="mt-4 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">All Requests (Staff & Queries)</h3>
            {pendingStaff.map(staff => (
              <div key={staff._id} className="border-b py-2">
                <span>Staff Request: {staff.name} - {staff.email}</span>
                <div className="mt-2">
                  <button onClick={() => approveStaff(staff._id)} className="bg-green-500 text-white px-2 py-1 rounded mr-2">Approve</button>
                  <button onClick={() => rejectStaff(staff._id)} className="bg-red-500 text-white px-2 py-1 rounded">Reject</button>
                </div>
              </div>
            ))}
            {queries.map(query => (
              <div key={query._id} className="border-b py-2 flex justify-between items-center">
                <span>Query from {query.staffId?.name}: {query.message}</span>
                <button onClick={() => clearQuery(query._id)} className="bg-blue-500 text-white px-2 py-1 rounded">Clear</button>
              </div>
            ))}
            <button onClick={clearAllQueries} className="bg-gray-500 text-white px-4 py-2 rounded mt-4">Clear All Queries</button>
          </div>
        )}
      </div>

      {/* Manage Staff Section */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Manage Staff</h3>
        {allStaff.map(staff => (
          <div key={staff._id} className="border-b py-2 flex justify-between">
            <span>{staff.name} - {staff.email}</span>
            <button onClick={() => removeStaff(staff._id)} className="bg-red-500 text-white px-2 py-1 rounded">Remove</button>
          </div>
        ))}
        <h4 className="text-lg font-semibold mt-4 mb-2">Add New Staff</h4>
        <input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="Name" className="border p-2 mr-2" />
        <input value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="Email" className="border p-2 mr-2" />
        <input value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} placeholder="Password" type="password" className="border p-2 mr-2" />
        <button onClick={addStaff} className="bg-green-500 text-white px-4 py-2 rounded">Add Staff</button>
      </div>

      {/* Analytics Section */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-2">Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-100 p-4 rounded">
            <h4 className="font-bold">Total Orders</h4>
            <p className="text-2xl">{analytics.totalOrders || 0}</p>
          </div>
          <div className="bg-green-100 p-4 rounded">
            <h4 className="font-bold">Total Revenue</h4>
            <p className="text-2xl">${analytics.totalRevenue || 0}</p>
          </div>
        </div>
        <h4 className="font-bold mt-4">Category/Dish Breakdown</h4>
        <p className="text-gray-500">No orders yet. Data will appear here.</p>
      </div>
    </div>
  );
};

export default AdminOverview;