import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const AdminTables = () => {
  const [tables, setTables] = useState([]);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [qrModal, setQrModal] = useState(null); // For displaying QR

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = () => {
    api.getTables().then(res => setTables(res.data));
  };

  const addTable = () => {
    api.createTable({ number: parseInt(newTableNumber) }).then(() => {
      loadTables();
      setNewTableNumber('');
    });
  };

  const deleteTable = (id) => {
    api.deleteTable(id).then(() => loadTables());
  };

  const generateQR = (table) => {
    api.generateQR(table._id).then(res => {
      setQrModal({ qrData: res.data.qrData, qrUrl: res.data.qrUrl, table });
    }).catch(err => alert('Failed to generate QR'));
  };

  const downloadQR = () => {
    if (!qrModal) return;
    const link = document.createElement('a');
    link.href = qrModal.qrData;
    link.download = `QR_Table_${qrModal.table.number}.png`;
    link.click();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Table - QR Management</h2>
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Add Table</h3>
        <input value={newTableNumber} onChange={(e) => setNewTableNumber(e.target.value)} placeholder="Table Number" type="number" className="border p-2 mr-2" />
        <button onClick={addTable} className="bg-orange-500 text-white px-4 py-2 rounded">Add Table</button>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Tables</h3>
        <ul>
          {tables.map(table => (
            <li key={table._id} className="flex justify-between items-center border-b py-2">
              <span>Table {table.number} - QR Slug: {table.qrSlug}</span>
              <div>
                <button onClick={() => generateQR(table)} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Generate QR</button>
                <button onClick={() => deleteTable(table._id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">QR Code for Table {qrModal.table.number}</h3>
            <img src={qrModal.qrData} alt="QR Code" className="w-full mb-4" />
            <p className="text-sm mb-4">URL: {qrModal.qrUrl}</p>
            <button onClick={downloadQR} className="bg-green-500 text-white px-4 py-2 rounded mr-2">Download QR</button>
            <button onClick={() => setQrModal(null)} className="bg-gray-500 text-white px-4 py-2 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTables;