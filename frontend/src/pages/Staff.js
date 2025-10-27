import React, { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';

const Staff = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showAccount, setShowAccount] = useState(false);
  const [queryMessage, setQueryMessage] = useState('');
  const [staffDetails, setStaffDetails] = useState({ name: 'Loading...', email: '' });
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const loadOrders = useCallback(() => {
    api.getOrders()
      .then(res => {
        setOrders(res.data);
        setLoading(false);

        const newOrders = res.data.filter(
          o => o.status === 'placed' && !notifications.includes(o._id)
        );

        if (newOrders.length) {
          setNotifications(prev => [
            ...prev,
            ...newOrders.map(o => o._id)
          ]);
          alert(`New order(s) from table(s): ${newOrders.map(o => o.tableId?.number).join(', ')}`);
        }
      })
      .catch(() => {
        setError('Failed to load orders');
        setLoading(false);
      });
  }, [notifications]);  // Added notifications to dependencies

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/';
      return;
    }
    loadOrders();
    loadStaffDetails();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const loadStaffDetails = () => {
    api.getStaffDetails().then(res => {
      setStaffDetails(res.data);
      setEditName(res.data.name);
      setEditEmail(res.data.email);
    }).catch(() => {
      setError('Failed to load staff details');
    });
  };

  const updateStatus = (id, status) => {
    api.updateOrderStatus(id, { status }).then(() => loadOrders());
  };

//   const updateStatus = async (orderId, newStatus) => {
//   await fetch(`/api/orders/${orderId}`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ status: newStatus }),
//   });

//   // ✅ Re-fetch orders in Staff dashboard
//   loadOrders();
// };



  const deleteOrder = async (id) => {
  try {
    await api.deleteOrder(id);
    setOrders(prev => prev.filter(o => o._id !== id));
  } catch (err) {
    alert('Failed to delete order');
  }
};
  // const sendQuery = () => {
  //   if (!queryMessage.trim()) return;
  //   api.sendQuery({ message: queryMessage }).then(() => {
  //     alert('Query sent to admin');
  //     setQueryMessage('');
  //   }).catch(err => {
  //     console.error(err);
  //     alert('Failed to send query: ' + (err.response?.data?.message || 'Unknown error'));
  //   });
  // };
  const sendQuery = async () => {
    if (!queryMessage.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in as staff to send queries.');
      return;
    }
    try {
      await api.sendQuery({ message: queryMessage });
      alert('Query sent to admin');
      setQueryMessage('');
    } catch (err) {
      console.error('sendQuery error:', err.response?.data || err);
      alert('Failed to send query: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const handleLogout = () => {
    api.logout().then(() => {
      localStorage.clear();
      window.location.href = '/';
    });
  };

  const deleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      api.removeStaff(staffDetails._id).then(() => {
        alert('Account deleted successfully.');
        handleLogout();
      }).catch(() => alert('Failed to delete account.'));
    }
  };

  const getInitials = (name) => {
    if (!name || name === 'Loading...' || name === '') return 'S';
    const words = name.split(' ');
    if (words.length === 1) return words[0][0].toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase();
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div></div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => setShowAccount(!showAccount)} className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
            {getInitials(staffDetails.name)}
          </button>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
        </div>
      </header>

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
                    setStaffDetails({ ...staffDetails, name: editName, email: editEmail });
                    setEditing(false);
                  }).catch(() => alert('Failed to update'));
                }} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Save</button>
                <button onClick={() => setEditing(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
              </>
            ) : (
              <>
                <p><strong>Name:</strong> {staffDetails.name}</p>
                <p><strong>Email:</strong> {staffDetails.email}</p>
                <button onClick={() => setEditing(true)} className="bg-yellow-500 text-white px-4 py-2 rounded mr-2">Edit</button>
                <button onClick={deleteAccount} className="bg-red-500 text-white px-4 py-2 rounded">Delete Account</button>
              </>
            )}
            <button onClick={() => setShowAccount(false)} className="bg-gray-500 text-white px-4 py-2 rounded mt-2 ml-2">Close</button>
          </div>
        </div>
      )}

      {/* Query Section */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-2">Send Query to Admin</h3>
        <textarea value={queryMessage} onChange={(e) => setQueryMessage(e.target.value)} placeholder="Write your query (e.g., leave request, missing items)" className="border p-2 w-full mb-2" rows="4"></textarea>
        <button onClick={sendQuery} className="bg-green-500 text-white px-4 py-2 rounded">Send Query</button>
      </div>

      {/* Orders */}
      <div className="space-y-4">
        {orders.length === 0 ? (
  <p className="text-center text-gray-500 py-8">There are no active orders.</p>
) : (
  orders.map(order => (
    <div key={order._id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
  <div>
    <p className="font-bold text-lg">Table {order.tableId?.number || 'N/A'}</p> {/* Made larger */}
    <p className="text-gray-600">Status: 
      <span className={order.status === 'placed' ? 'text-red-500' : order.status === 'preparing' ? 'text-yellow-500' : 'text-green-500'}>
        {order.status}
      </span>
    </p>
  </div>
  <button onClick={() => setSelectedOrder(order)} className="bg-blue-500 text-white px-4 py-2 rounded">Show</button>
  <button onClick={() => deleteOrder(order._id)} className="bg-red-500 text-white px-4 py-2 rounded ml-2">Clear</button>
</div>
  )))}
</div>

{/* Order Details Modal */}
{selectedOrder && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
      <h3 className="text-xl font-bold mb-4">Order Details - Table {selectedOrder.tableId?.number || 'N/A'}</h3>
      <ul className="mb-4">
        {selectedOrder.items.map((item, i) => (
          // <li key={i} className="text-sm">{item.menuItemId?.name}   {item.qty}pc/plate -  ${item.menuItemId?.price}</li>
          <li key={i} className="flex justify-between text-sm py-1 border-b border-gray-200">
  <span className="font-medium">{item.menuItemId?.name}</span>
  <span>
    {item.qty} × ₹{item.menuItemId?.price} = 
    <span className="font-semibold"> ₹{item.qty * item.menuItemId?.price}</span>
  </span>
</li>
        ))}
        {/* ✅ Total Row */}
  <li className="flex justify-between text-lg py-2 mt-2 font-bold ">
    <span>Total:</span>
    <span>₹{selectedOrder.totals}</span>
  </li>
      </ul>
      <div className="flex space-x-2 mb-4">
        <button
  onClick={() => {
    updateStatus(selectedOrder._id, 'placed');
    setSelectedOrder(prev => ({ ...prev, status: 'placed' }));
  }}
  className={`px-4 py-2 rounded ${
    selectedOrder.status === 'placed' 
      ? 'bg-red-500 text-white' 
      : 'bg-gray-300'
  }`}
>
  Pending
</button>

<button
  onClick={() => {
    updateStatus(selectedOrder._id, 'preparing');
    setSelectedOrder(prev => ({ ...prev, status: 'preparing' }));
  }}
  className={`px-4 py-2 rounded ${
    selectedOrder.status === 'preparing' 
      ? 'bg-yellow-400 text-white'
      : 'bg-gray-300'
  }`}
>
  Preparing
</button>

<button
  onClick={() => {
    updateStatus(selectedOrder._id, 'ready');
    setSelectedOrder(prev => ({ ...prev, status: 'ready' }));
  }}
  className={`px-4 py-2 rounded ${
    selectedOrder.status === 'ready' 
      ? 'bg-green-500 text-white'
      : 'bg-gray-300'
  }`}
>
  Prepared
</button>

      </div>
      <button onClick={() => setSelectedOrder(null)} className="bg-gray-500 text-white px-4 py-2 rounded w-full">Close</button>
    </div>
  </div>
)}
    </div>
  );
};

export default Staff;