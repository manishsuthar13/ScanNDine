import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const AdminMenu = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', categoryId: '', image: null, availability: true });
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('all');  // 'all', 'available', 'unavailable'
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    api.getMenuCategories().then(res => {
      console.log('Categories loaded:', res.data);  // Debug
      setCategories(res.data);
    });
    api.getMenuItems().then(res => {
      console.log('Items loaded:', res.data);  // Debug
      setItems(res.data);
    });
  };

  const addCategory = () => {
    api.createCategory({ name: newCategory }).then(() => {
      loadData();
      setNewCategory('');
    });
  };

  const addItem = () => {
    const formData = new FormData();
    formData.append('name', newItem.name);
    formData.append('description', newItem.description);
    formData.append('price', newItem.price);
    formData.append('categoryId', newItem.categoryId);
    formData.append('availability', newItem.availability);
    if (newItem.image) formData.append('image', newItem.image);
    api.createItem(formData).then(() => {
      loadData();
      setNewItem({ name: '', description: '', price: '', categoryId: '', image: null, availability: true });
    });
  };

  const updateItem = () => {
    const formData = new FormData();
    formData.append('name', editingItem.name);
    formData.append('description', editingItem.description);
    formData.append('price', editingItem.price);
    formData.append('categoryId', editingItem.categoryId);
    formData.append('availability', editingItem.availability);
    if (editingItem.image && typeof editingItem.image !== 'string') formData.append('image', editingItem.image);
    api.updateItem(editingItem._id, formData).then(() => {
      loadData();
      setEditingItem(null);
      setShowEditModal(false);
    });
  };

  const deleteItem = (id) => {
    api.deleteItem(id).then(() => loadData());
  };

  const toggleAvailability = (id, current) => {
    api.updateItem(id, { availability: !current }).then(() => loadData());
  };

  const filteredItems = items.filter(item => {
    if (filter === 'available') return item.availability;
    if (filter === 'unavailable') return !item.availability;
    return true;  // Show all for 'all'
  });

  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat._id] = filteredItems.filter(item => item.categoryId._id === cat._id);
    console.log(`Items for category ${cat.name} (${cat._id}):`, acc[cat._id]);  // Debug
    return acc;
  }, {});

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Menu Management</h2>

      {/* Add Category */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-2">Add Category</h3>
        <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category Name" className="border p-2 mr-2" />
        <button onClick={addCategory} className="bg-orange-500 text-white px-4 py-2 rounded">Add Category</button>
      </div>

      {/* Add Item */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-2">Add Item</h3>
        <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Name" className="border p-2 mr-2 mb-2" />
        <input value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Description" className="border p-2 mr-2 mb-2" />
        <input value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })} placeholder="Price" type="number" className="border p-2 mr-2 mb-2" />
        <select value={newItem.categoryId} onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })} className="border p-2 mr-2 mb-2">
          <option value="">Select Category</option>
          {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
        </select>
        <input type="file" onChange={(e) => setNewItem({ ...newItem, image: e.target.files[0] })} className="border p-2 mr-2 mb-2" />
        <button onClick={addItem} className="bg-green-500 text-white px-4 py-2 rounded">Add Item</button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <button onClick={() => setFilter('all')} className={`mr-2 px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>All Items</button>
        <button onClick={() => setFilter('available')} className={`mr-2 px-4 py-2 rounded ${filter === 'available' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Available</button>
        <button onClick={() => setFilter('unavailable')} className={`px-4 py-2 rounded ${filter === 'unavailable' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Unavailable</button>
      </div>

      {/* Items by Category */}
      {categories.map(cat => (
        <div key={cat._id} className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">{cat.name}</h3>
          {groupedItems[cat._id]?.length === 0 ? <p>No items in this category.</p> : (
            groupedItems[cat._id].map(item => (
              <div key={item._id} className="flex items-center justify-between border-b py-4">
                <div className="flex items-center">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded mr-4" />}
                  <div>
                    <h4 className="font-bold">{item.name}</h4>
                    <p className="text-gray-600">{item.description}</p>
                    <p className="text-green-600">₹{item.price}</p>
                    {!item.availability && <span className="text-red-500">(Unavailable)</span>}
                  </div>
                </div>
                <div>
                  <button onClick={() => toggleAvailability(item._id, item.availability)} className={`px-4 py-2 rounded mr-2 ${item.availability ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {item.availability ? 'Available' : 'Unavailable'}
                  </button>
                  <button onClick={() => { setEditingItem(item); setShowEditModal(true); }} className="bg-yellow-500 text-white px-4 py-2 rounded mr-2">Edit</button>
                  <button onClick={() => deleteItem(item._id)} className="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      ))}

      {/* Edit Modal */}
{showEditModal && editingItem && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <h3 className="text-xl font-bold mb-4">Edit Item</h3>
      <label className="block mb-2">Name:</label>
      <input value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} className="border p-2 w-full mb-2" />
      <label className="block mb-2">Description:</label>
      <input value={editingItem.description} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} className="border p-2 w-full mb-2" />
      <label className="block mb-2">Price:</label>
      <input value={editingItem.price} onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })} type="number" className="border p-2 w-full mb-2" />
      <label className="block mb-2">Category:</label>
      <select value={editingItem.categoryId._id || editingItem.categoryId} onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })} className="border p-2 w-full mb-2">
        {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
      </select>
      <label className="block mb-2">Image:</label>
      <input type="file" onChange={(e) => setEditingItem({ ...editingItem, image: e.target.files[0] })} className="border p-2 w-full mb-2" />
      <div className="flex justify-end">
        <button onClick={() => { setEditingItem(null); setShowEditModal(false); }} className="bg-gray-500 text-white px-4 py-2 rounded mr-2">Cancel</button>
        <button onClick={updateItem} className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminMenu;