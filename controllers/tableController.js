const Table = require('../models/Table');
const { isId, handleDuplicate } = require('../utils/validation');
const { paginate } = require('../utils/pagination');

// Get all tables (admin)
const getTables = async (req, res) => {
  try {
    // Includes qrData
    res.json(await paginate(Table, { restaurantId: req.user.restaurantId }, req.query, (q) => q.sort({ number: 1 })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create table (admin)
const createTable = async (req, res) => {
  const number = parseInt(req.body.number, 10);
  if (!Number.isInteger(number) || number < 1) return res.status(400).json({ message: 'Enter a valid table number' });
  try {
    const qrSlug = `table-${number}`;
    const table = new Table({ restaurantId: req.user.restaurantId, number, qrSlug });
    await table.save();
    res.status(201).json(table);
  } catch (error) {
    if (handleDuplicate(error, res)) return;
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete table (admin)
const deleteTable = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    await Table.findOneAndDelete({ _id: req.params.id, restaurantId: req.user.restaurantId });
    res.json({ message: 'Table deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate QR code for a table (returns base64 image data)
const generateQR = async (req, res) => {
  const { id } = req.params;
  try {
    if (!isId(id)) return res.status(400).json({ message: 'Invalid id' });
    const table = await Table.findOne({ _id: id, restaurantId: req.user.restaurantId });
    if (!table) return res.status(404).json({ message: 'Table not found' });

    // Normalize base URL and remove trailing slash if present
    let baseUrl = (process.env.BASE_URL || 'http://localhost:3000').trim();
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    const qrUrl = `${baseUrl}/menu?r=${table.restaurantId}&table=${table.qrSlug}`;
    const QRCode = require('qrcode');
    const qrData = await QRCode.toDataURL(qrUrl);

    // Save QR data and qrUrl to DB (overwrite any old qrData)
    table.qrData = qrData;
    table.qrUrl = qrUrl;   // <-- save the URL as well for easier debugging later
    await table.save();

    res.json({ qrData, qrUrl });
  } catch (error) {
    console.error('generateQR error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getTables, createTable, deleteTable, generateQR };
