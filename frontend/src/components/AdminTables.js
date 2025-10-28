import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const AdminTables = () => {
  const [tables, setTables] = useState([]);
  const [qrModal, setQrModal] = useState(null); // For displaying QR
  const [storedQRs, setStoredQRs] = useState({}); // Store QR data by table ID

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = () => {
    api.getTables().then(res => {
      setTables(res.data);
      // Load stored QR data from DB
      const qrMap = {};
      res.data.forEach(table => {
        if (table.qrData) qrMap[table._id] = table.qrData;
      });
      setStoredQRs(qrMap);
    });
  };

  const addTable = () => {
    const newTableNumber = prompt('Enter table number:');
    if (newTableNumber) {
      api.createTable({ number: parseInt(newTableNumber) }).then(() => loadTables());
    }
  };

  const deleteTable = (id) => {
    api.deleteTable(id).then(() => {
      setStoredQRs(prev => {
        const updated = { ...prev };
        delete updated[id]; // Remove stored QR
        return updated;
      });
      loadTables();
    });
  };

  const generateQR = (table) => {
    api.generateQR(table._id).then(res => {
      setStoredQRs(prev => ({ ...prev, [table._id]: res.data.qrData })); // Store QR
      setQrModal({ qrData: res.data.qrData, qrUrl: res.data.qrUrl, table });
    }).catch(err => alert('Failed to generate QR'));
  };

  const showQR = (table) => {
  const qrData = storedQRs[table._id];
  if (qrData) {
    const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:3000'; // Use frontend URL
    setQrModal({ qrData, qrUrl: `${baseUrl}/menu?table=${table.qrSlug}`, table });
  } else {
    alert('QR not generated yet. Click Generate QR first.');
  }
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
                <button onClick={() => showQR(table)} className="bg-green-500 text-white px-2 py-1 rounded mr-2">Show</button>
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
            <button onClick={downloadQR} className="bg-green-500 text-white px-4 py-2 rounded mr-2">Download</button>
            <button onClick={() => setQrModal(null)} className="bg-gray-500 text-white px-4 py-2 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTables;