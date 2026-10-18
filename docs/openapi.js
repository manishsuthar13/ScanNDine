// OpenAPI description served by Swagger UI at /api. Keep in sync when routes change.
const json = (schema) => ({ content: { 'application/json': { schema } } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const ok = (description, schema) => ({ description, ...(schema ? json(schema) : {}) });
const bearer = [{ bearerAuth: [] }];
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string' } };
const restaurantParam = { name: 'restaurantId', in: 'path', required: true, schema: { type: 'string' } };
const pageParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
];
const paged = (item) => ({
  type: 'object',
  properties: { data: { type: 'array', items: item }, pagination: ref('Pagination') },
});
const body = (properties, required = []) => ({ required: true, ...json({ type: 'object', required, properties }) });
const str = { type: 'string' };
const errors = {
  400: ok('Validation failed', ref('Error')),
  401: ok('Missing or invalid token', ref('Error')),
  403: ok('Role not allowed', ref('Error')),
};
const op = (tag, summary, extra = {}) => ({ tags: [tag], summary, ...extra });
const secured = (tag, summary, extra = {}) => op(tag, summary, { security: bearer, responses: { 200: ok('OK'), ...errors }, ...extra });
const credentials = { username: str, email: str, password: str };

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Scan & Dine API',
    version: '1.0.0',
    description: [
      'Roles: **superadmin** (one, seeded) > **admin** (per restaurant) > **staff** (created by admins). Customers never log in - they use the public endpoints from a table QR code.',
      'Passwords need 8+ characters, one capital letter and one special character. Usernames use letters, numbers, "_" and "." only.',
      'List endpoints return `{ data, pagination }` and accept `page` and `limit`.',
    ].join('\n\n'),
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Auth' }, { name: 'Superadmin' }, { name: 'Team' }, { name: 'Menu' },
    { name: 'Tables' }, { name: 'Orders' }, { name: 'Public (customers)' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: { type: 'object', properties: { message: str } },
      Pagination: {
        type: 'object',
        properties: { page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' }, totalPages: { type: 'integer' } },
      },
      User: {
        type: 'object',
        properties: { _id: str, username: str, email: str, role: { type: 'string', enum: ['superadmin', 'admin', 'staff'] }, restaurantId: str },
      },
      Session: {
        type: 'object',
        properties: { accessToken: str, refreshToken: str, user: ref('User'), restaurant: { type: 'object', properties: { _id: str, name: str } } },
      },
    },
  },
  paths: {
    '/auth/signup': { post: op('Auth', 'Register a restaurant and its first admin', {
      requestBody: body({ restaurantName: str, email: str, phone: str, username: str, password: str }, ['restaurantName', 'email', 'username', 'password']),
      responses: { 201: ok('Created', ref('Session')), 400: errors[400], 409: ok('Username or email taken', ref('Error')) },
    }) },
    '/auth/login': { post: op('Auth', 'Log in with username or email', {
      description: '`identifier` is treated as an email when it has email format, otherwise as a username.',
      requestBody: body({ identifier: str, password: str }, ['identifier', 'password']),
      responses: { 200: ok('Logged in', ref('Session')), 400: errors[400], 401: ok('Invalid credentials', ref('Error')) },
    }) },
    '/auth/forgot-password': { post: op('Auth', 'Email a password reset link', {
      description: 'Always answers 200 so accounts cannot be discovered. The link is valid for 30 minutes.',
      requestBody: body({ identifier: str }, ['identifier']),
      responses: { 200: ok('Request accepted'), 400: errors[400] },
    }) },
    '/auth/reset-password': { post: op('Auth', 'Set a new password using an emailed token', {
      requestBody: body({ token: str, password: str }, ['token', 'password']),
      responses: { 200: ok('Password updated'), 400: errors[400] },
    }) },
    '/auth/refresh': { post: op('Auth', 'Get a new access token', {
      requestBody: body({ refreshToken: str }, ['refreshToken']),
      responses: { 200: ok('New access token', { type: 'object', properties: { accessToken: str } }), 401: errors[401] },
    }) },
    '/auth/logout': { post: secured('Auth', 'Log out') },
    '/auth/me': {
      get: secured('Auth', 'Current user and restaurant'),
      put: secured('Auth', 'Update own username and email', { requestBody: body({ username: str, email: str }, ['username', 'email']) }),
    },
    '/auth/password': { put: secured('Auth', 'Change own password', { requestBody: body({ currentPassword: str, newPassword: str }, ['currentPassword', 'newPassword']) }) },
    '/auth/queries': {
      get: secured('Auth', 'Admin: staff queries for the restaurant', { parameters: pageParams }),
      post: secured('Auth', 'Staff/admin: send a query to the restaurant admins', { requestBody: body({ message: str }, ['message']) }),
    },
    '/auth/queries/{id}': { delete: secured('Auth', 'Admin: clear a query', { parameters: [idParam] }) },

    '/superadmin/overview': { get: secured('Superadmin', 'Platform-wide totals') },
    '/superadmin/restaurants': { get: secured('Superadmin', 'Restaurants with admins, staff, orders and revenue', {
      parameters: [...pageParams, { name: 'search', in: 'query', schema: str }],
    }) },
    '/superadmin/restaurants/{id}': { get: secured('Superadmin', 'One restaurant: admins, staff, stats, recent orders', { parameters: [idParam] }) },
    '/superadmin/admins': { post: secured('Superadmin', 'Create an admin for an existing or new restaurant', {
      description: 'Send `restaurantId` for an existing restaurant, or `restaurantName` (and optional `phone`) to create one.',
      requestBody: body({ ...credentials, restaurantId: str, restaurantName: str, phone: str }, ['username', 'email', 'password']),
    }) },

    '/admin/staff': {
      get: secured('Team', 'List staff of own restaurant', { parameters: pageParams }),
      post: secured('Team', 'Create a staff member', { requestBody: body(credentials, ['username', 'email', 'password']) }),
    },
    '/admin/staff/{id}': { delete: secured('Team', 'Remove a staff member', { parameters: [idParam] }) },
    '/admin/admins': {
      get: secured('Team', 'List admins of own restaurant', { parameters: pageParams }),
      post: secured('Team', 'Create another admin', { requestBody: body(credentials, ['username', 'email', 'password']) }),
    },
    '/admin/admins/{id}': { delete: secured('Team', 'Remove an admin (never yourself or the last one)', { parameters: [idParam] }) },

    '/menu/categories': {
      get: secured('Menu', 'Admin: list categories', { parameters: pageParams }),
      post: secured('Menu', 'Admin: create a category', { requestBody: body({ name: str, displayOrder: { type: 'integer' } }, ['name']) }),
    },
    '/menu/items': {
      get: secured('Menu', 'Admin: list items', { parameters: [...pageParams, { name: 'categoryId', in: 'query', schema: str }, { name: 'availability', in: 'query', schema: { type: 'boolean' } }] }),
      post: secured('Menu', 'Admin: create an item (multipart, optional image)', { requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { name: str, description: str, price: { type: 'number' }, categoryId: str, availability: { type: 'boolean' }, image: { type: 'string', format: 'binary' } } } } } } }),
    },
    '/menu/items/{id}': {
      put: secured('Menu', 'Admin: update an item', { parameters: [idParam] }),
      delete: secured('Menu', 'Admin: delete an item', { parameters: [idParam] }),
    },

    '/tables': {
      get: secured('Tables', 'Admin: list tables', { parameters: pageParams }),
      post: secured('Tables', 'Admin: add a table', { requestBody: body({ number: { type: 'integer' } }, ['number']) }),
    },
    '/tables/{id}': { delete: secured('Tables', 'Admin: delete a table', { parameters: [idParam] }) },
    '/tables/{id}/qr': { get: secured('Tables', 'Admin: generate the table QR code', { parameters: [idParam] }) },

    '/orders': { get: secured('Orders', 'Staff/admin: active orders', { parameters: [...pageParams, { name: 'status', in: 'query', schema: str }] }) },
    '/orders/analytics': { get: secured('Orders', 'Staff/admin: totals and dish breakdown') },
    '/orders/{id}/status': { patch: secured('Orders', 'Staff/admin: update status', {
      parameters: [idParam],
      requestBody: body({ status: { type: 'string', enum: ['placed', 'preparing', 'ready', 'served', 'canceled'] } }, ['status']),
    }) },
    '/orders/{id}': { delete: secured('Orders', 'Staff/admin: clear an order from the board', { parameters: [idParam] }) },

    '/public/restaurants/{restaurantId}/menu': { get: op('Public (customers)', 'Restaurant name, active categories and items', { parameters: [restaurantParam], responses: { 200: ok('OK'), 404: ok('Not found', ref('Error')) } }) },
    '/public/restaurants/{restaurantId}/orders': {
      get: op('Public (customers)', 'Orders placed from a table', { parameters: [restaurantParam, { name: 'table', in: 'query', required: true, schema: str }, ...pageParams], responses: { 200: ok('OK', paged({ type: 'object' })), 400: errors[400] } }),
      post: op('Public (customers)', 'Place an order from a table', {
        parameters: [restaurantParam],
        requestBody: body({ tableId: str, items: { type: 'array', items: { type: 'object', properties: { menuItemId: str, qty: { type: 'integer' } } } } }, ['tableId', 'items']),
        responses: { 201: ok('Created'), 400: errors[400] },
      }),
    },
  },
};
