const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, { ms: Date.now() - started });
  });
  next();
};

module.exports = requestLogger;
