const Table = require('../models/Table');

// Get all tables (admin)
const getTables = async (req, res) => {
  try {
    const tables = await Table.find();
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

module.exports = { getTables, createTable, getTableBySlug };