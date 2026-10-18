require('dotenv').config();
const connectDB = require('./config/database');
const seedSuperadmin = require('./config/seed');
const app = require('./app');
const logger = require('./utils/logger');

connectDB().then(seedSuperadmin);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
