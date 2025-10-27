import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Menu = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userDetails, setUserDetails] = useState({ name: '', email: '' });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [editing, setEditing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orderPlaced, setOrderPlaced] = useState(null); // To show order confirmation

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserDetails();
    }
    loadMenuData();
  }, [isLoggedIn]);

  // Project/ScanNDine/frontend/src/pages/Menu.js - Add/update these functions
useEffect(() => {
  // Poll for order updates every 5 seconds
  const fetchOrders = async () => {
    try {
      // Get table ID from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const tableId = urlParams.get('table');
      
      const config = tableId ? { params: { table: tableId } } : {};
      const res = await api.getCustomerOrders(config);
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err.response?.data || err);
    }
  };

  fetchOrders(); // Initial fetch
  const interval = setInterval(fetchOrders, 5000); // Poll every 5 seconds
  
  return () => clearInterval(interval); // Cleanup
}, []); // Empty deps array - run once on mount


  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const fetchUserDetails = async () => {
    try {
      const res = await api.getStaffDetails();
      setUserDetails(res.data);
      setEditForm({ name: res.data.name, email: res.data.email });
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      setIsLoggedIn(false);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  };

//   const fetchOrders = async () => {
//   try {
//     const res = await api.getCustomerOrders(); // ✅ Right endpoint for customer
//     setOrders(res.data);
//   } catch (err) {
//     console.log("Failed to fetch customer orders:", err.response?.data || err);
//   }
// };

// const fetchOrders = async () => {
//   try {
    // Get table ID from URL query params
//     const urlParams = new URLSearchParams(window.location.search);
//     const tableId = urlParams.get('table');
    
//     let response;
//     if (isLoggedIn) {
      // Logged in customer - fetch their orders
//       response = await api.getCustomerOrders();
//     } else if (tableId) {
//       // Guest with table - fetch table orders
//       response = await api.getCustomerOrders({ 
//         params: { table: tableId }
//       });
//     } else {
      // Guest without table - show empty state
//       setOrders([]);
//       return;
//     }
    
//     setOrders(response.data);
//   } catch (err) {
//     console.error("Failed to fetch customer orders:", err.response?.data || err);
//     setError(err.response?.data?.message || 'Failed to load orders');
//   }
// };


  const loadMenuData = async () => {
    try {
      const [catRes, itemRes] = await Promise.all([
        api.getMenuCategories(),
        api.getMenuItems()
      ]);
      setCategories(catRes.data);
      setItems(itemRes.data);
    } catch (err) {
      console.error('Failed to load menu data:', err);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (authMode === 'login') {
        const res = await api.login({ email: authForm.email, password: authForm.password, role: 'customer' });
        localStorage.setItem('token', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        setIsLoggedIn(true);
        await fetchUserDetails();
        setShowAuthModal(false);
        setAuthForm({ name: '', email: '', password: '' });
      } else {
        await api.register({ ...authForm, role: 'customer' });
        alert('Registered! Please login.');
        setAuthMode('login');
        setAuthForm({ name: '', email: '', password: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred');
    }
  };

  const handleEditSubmit = async () => {
    try {
      await api.updateStaffDetails(editForm);
      setUserDetails(editForm);
      setEditing(false);
      alert('Details updated!');
    } catch (err) {
      alert('Failed to update details.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    setUserDetails({ name: '', email: '' });
    setShowHistory(false);
    setCart([]);
  };

  const fetchHistory = async () => {
    try {
      const res = await api.getCustomerOrders();
      setOrders(res.data);
      setShowHistory(true);
    } catch (err) {
  console.error('Fetch history error:', err.response?.data || err);
  alert(`Failed to load order history: ${err.response?.data?.message || 'Unknown error'}`);
}
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c._id === item._id);
      if (existing) {
        return prev.map(c => c._id === item._id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(c => c._id !== id));
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) return removeFromCart(id);
    setCart(prev => prev.map(c => c._id === id ? { ...c, qty } : c));
  };

  const getTotal = () => cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const placeOrder = async () => {
  if (cart.length === 0) return;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tableId = urlParams.get('table') || 1;  // Dynamic from URL (e.g., ?table=4), default 1
    if (isNaN(parseInt(tableId))) {
  alert('Invalid table ID. Please scan a valid QR code.');
  return;
}
const orderData = {
      tableId: parseInt(tableId),  // Use dynamic tableId
      items: cart.map(item => ({ menuItemId: item._id, qty: item.qty }))
    };
    const res = await api.placeOrder(orderData);
    setOrderPlaced(res.data);
    setCart([]);
    setShowCart(false);
    if (!isLoggedIn) {
      alert('Order placed! Login to save your order in order history and track status.');
    } else {
      alert('Order placed and saved to history!');
    }
  } catch (err) {
  console.error('Place order error:', err.response?.data || err);  // Log for debugging
  alert(`Failed to place order: ${err.response?.data?.message || 'Unknown error'}`);
}
};

  const getInitials = (name) => {
    if (!name) return 'C';
    const words = name.split(' ');
    if (words.length === 1) return words[0][0].toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed': return 'text-red-500';
      case 'preparing': return 'text-yellow-500';
      case 'ready': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  // Group items by category
  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat._id] = items.filter(item => item.categoryId._id === cat._id && item.availability);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">
           {(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const tableId = urlParams.get('table');
  return tableId ? <p className="text-lg text-gray-600">You are at Table {tableId.replace('table-', '')}</p> : null;
})()}
          WELCOME {isLoggedIn ? userDetails.name : 'Guest'}
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCart(true)}
            className="relative bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            🛒 Cart ({cart.length})
          </button>
          {isLoggedIn ? (
            <>
              <button
                onClick={() => setShowAccountModal(true)}
                className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold"
                title="Account"
              >
                {getInitials(userDetails.name)}
              </button>
              <button
                onClick={fetchHistory}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                History
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Login/Signup
            </button>
          )}
        </div>
      </header>

      {/* Order Confirmation */}
      {orderPlaced && (
        <div className="mb-8 bg-green-100 p-4 rounded-lg">
          <p>Order placed! ID: {orderPlaced._id.slice(-6)}. Status: <span className={getStatusColor(orderPlaced.status)}>{orderPlaced.status}</span></p>
          <button onClick={() => setOrderPlaced(null)} className="bg-gray-500 text-white px-4 py-2 rounded mt-2">Close</button>
        </div>
      )}

      {/* History Section */}
      {showHistory && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Order History</h2>
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            orders.map(order => (
              <div key={order._id} className="border-b py-4">
                <p><strong>Order ID:</strong> {order._id.slice(-6)}</p>
                <p><strong>Table:</strong> {order.tableId?.number || 'N/A'}</p>
                <p><strong>Status:</strong> <span className={getStatusColor(order.status)}>{order.status}</span></p>
                <p><strong>Items:</strong></p>
                <ul className="ml-4">
                  {order.items.map((item, i) => (
                    <li key={i}>{item.qty}x {item.menuItemId?.name} - ₹{item.menuItemId?.price}</li>
                  ))}
                </ul>
                <p><strong>Total:</strong> ₹{order.totals}</p>
              </div>
            ))
          )}
          <button
            onClick={() => setShowHistory(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded mt-4"
          >
            Close History
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Your Cart</h3>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <>
                {cart.map(item => (
  <div key={item._id} className="border-b py-2">
    <p><strong>{item.name}</strong> - {item.qty}pc - ₹{item.price}/per - ₹{item.price * item.qty} total</p>
    <div className="flex items-center justify-between mt-2">
      <div className="flex items-center">
        <button onClick={() => updateQty(item._id, item.qty - 1)} className="bg-gray-300 px-2 rounded">-</button>
        <span className="mx-2">Qty: {item.qty}</span>
        <button onClick={() => updateQty(item._id, item.qty + 1)} className="bg-gray-300 px-2 rounded">+</button>
      </div>
      <button onClick={() => removeFromCart(item._id)} className="bg-red-500 text-white px-2 py-1 rounded">Remove</button>
    </div>
  </div>
))}
                <p className="font-bold mt-4">Total: ₹{getTotal()}</p>
                <button onClick={placeOrder} className="bg-green-500 text-white px-4 py-2 rounded mt-2 w-full">Place Order</button>
              </>
            )}
            <button onClick={() => setShowCart(false)} className="bg-gray-500 text-white px-4 py-2 rounded mt-2 w-full">Close</button>
          </div>
        </div>
      )}

      {/* Auth Modal (Login/Signup) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-center mb-6">
              {authMode === 'login' ? 'Login' : 'Signup'} as Customer
            </h2>
            <div className="flex mb-6">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 ${authMode === 'login' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 ${authMode === 'signup' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
              >
                Signup
              </button>
            </div>
            <form onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <input
                  type="text"
                  placeholder="Name"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="w-full p-3 border rounded mb-4"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full p-3 border rounded mb-4"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full p-3 border rounded mb-4"
                required
              />
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <button
                type="submit"
                className="w-full bg-green-500 text-white py-3 rounded hover:bg-green-600"
              >
                {authMode === 'login' ? 'Login' : 'Signup'}
              </button>
            </form>
            <button
              onClick={() => setShowAuthModal(false)}
              className="w-full bg-gray-500 text-white py-3 rounded mt-4 hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Account Modal (Edit Details) */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">Account Details</h3>
            {editing ? (
              <>
                <label className="block mb-2">Name:</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="border p-2 w-full mb-2"
                />
                <label className="block mb-2">Email:</label>
                <input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="border p-2 w-full mb-2"
                />
                <button
                  onClick={handleEditSubmit}
                  className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p><strong>Name:</strong> {userDetails.name}</p>
                <p><strong>Email:</strong> {userDetails.email}</p>
                <button
                  onClick={() => setEditing(true)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
                >
                  Edit
                </button>
              </>
            )}
            <button
              onClick={() => setShowAccountModal(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded mt-2 ml-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Menu Items by Category */}
      <div className="max-w-4xl mx-auto">
        {categories.filter(cat => cat.active).map(cat => (
          <div key={cat._id} className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">{cat.name}</h2>
            {groupedItems[cat._id]?.length === 0 ? (
              <p>No items available in this category.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedItems[cat._id].map(item => (
                  <div key={item._id} className="bg-gray-100 p-4 rounded-lg shadow">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover rounded mb-2" />
                    )}
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                    <p className="text-green-600 font-semibold">₹{item.price}</p>
                    {!item.availability && <span className="text-red-500 text-sm">(Unavailable)</span>}
                    {(() => {
  const currentQty = cart.find(c => c._id === item._id)?.qty || 0;
  return currentQty === 0 ? (
    <button
      onClick={() => addToCart(item)}
      className="bg-orange-500 text-white px-4 py-2 rounded mt-2 w-full hover:bg-orange-600"
    >
      Add to Cart
    </button>
  ) : (
    <div className="flex items-center justify-center mt-2">
      <button
        onClick={() => updateQty(item._id, currentQty - 1)}
        className="bg-gray-300 text-black px-2 py-1 rounded-l"
      >
        -
      </button>
      <span className="bg-gray-200 text-black px-4 py-1">{currentQty}</span>
      <button
        onClick={() => addToCart(item)}
        className="bg-gray-300 text-black px-2 py-1 rounded-r"
      >
        +
      </button>
    </div>
  );
})()}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {categories.length === 0 && <p className="text-center">No menu categories available.</p>}
      </div>
    </div>
  );
};

export default Menu;