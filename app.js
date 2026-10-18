const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi');
const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(requestLogger);

// Swagger UI lives at {backend_url}/api; mounted before helmet so its inline scripts aren't blocked
app.use('/api', swaggerUi.serve);
app.get('/api', swaggerUi.setup(openapi, { customSiteTitle: 'Scan & Dine API' }));

app.use(helmet());
app.use(cors({
  origin: (process.env.BASE_URL || '').trim().replace(/\/$/, ''),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

const v1 = express.Router();
v1.use('/auth', require('./routes/auth'));
v1.use('/superadmin', require('./routes/superadmin'));
v1.use('/admin', require('./routes/team'));
v1.use('/menu', require('./routes/menu'));
v1.use('/tables', require('./routes/table'));
v1.use('/orders', require('./routes/order'));
v1.use('/public', require('./routes/public'));
app.use('/api/v1', v1);

app.get('/', (req, res) => res.json({ message: 'Restaurant QR Menu API is running!', docs: '/api' }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
