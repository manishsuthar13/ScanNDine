const logger = require('../utils/logger');

const notFound = (req, res) => res.status(404).json({ message: 'Route not found' });

// Last-resort handler so every failure reaches the client as JSON with a sensible status
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });
  if (err.name === 'MulterError') return res.status(400).json({ message: err.message });
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, { error: err.message });
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
};

module.exports = { notFound, errorHandler };
