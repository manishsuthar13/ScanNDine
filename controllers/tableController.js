const Table = require('../models/Table');

// Get all tables (admin)
const getTables = async (req, res) => {
  try {
    const tables = await Table.find(); // Includes qrData
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create table (admin)
const createTable = async (req, res) => {
  const { number } = req.body;
  try {
    const qrSlug = `table-${number}`;
    const table = new Table({ number, qrSlug });
    await table.save();
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete table (admin)
const deleteTable = async (req, res) => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: 'Table deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get table by slug (public, for QR)
const getTableBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const table = await Table.findOne({ qrSlug: slug });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate QR code for a table (returns base64 image data)
const generateQR = async (req, res) => {
  const { id } = req.params;
  try {
    const table = await Table.findById(id);
    if (!table) return res.status(404).json({ message: 'Table not found' });
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'; // Use env var or fallback
    const qrUrl = `${baseUrl}/menu?table=${table.qrSlug}`; // Dynamic URL
    const QRCode = require('qrcode');
    const qrData = await QRCode.toDataURL(qrUrl);
    
    // Save QR data to DB
    table.qrData = qrData;
    await table.save();
    
    res.json({ qrData, qrUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getTables, createTable, deleteTable, getTableBySlug, generateQR };
