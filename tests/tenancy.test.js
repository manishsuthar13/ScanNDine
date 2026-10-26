const request = require('supertest');
const app = require('../app');
const { PASSWORD, setupDb, teardownDb, api, signupRestaurant } = require('./helpers');

let A, B, superToken, staffToken, staffId, category, item;

beforeAll(async () => {
  await setupDb();
  A = await signupRestaurant('a');
  B = await signupRestaurant('b');
  superToken = (await api('post', '/auth/login', { body: { identifier: 'superadmin', password: 'manishS_13' } })).body.accessToken;
});
afterAll(teardownDb);

describe('team', () => {
  it('lets an admin create staff, who can then log in', async () => {
    const res = await api('post', '/admin/staff', { token: A.token, body: { username: 'waiter1', email: 'w1@a.com', password: PASSWORD } });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('staff');
    staffId = res.body._id;
    const login = await api('post', '/auth/login', { body: { identifier: 'w1@a.com', password: PASSWORD } });
    staffToken = login.body.accessToken;
    expect(login.body.user.role).toBe('staff');
  });

  it('forbids staff from managing the team or the superadmin area', async () => {
    expect((await api('post', '/admin/staff', { token: staffToken, body: { username: 'x', email: 'x@x.com', password: PASSWORD } })).status).toBe(403);
    expect((await api('get', '/superadmin/overview', { token: A.token })).status).toBe(403);
  });

  it('allows several admins but never removing yourself or the last one', async () => {
    const second = await api('post', '/admin/admins', { token: A.token, body: { username: 'admin_a2', email: 'a2@a.com', password: PASSWORD } });
    expect(second.status).toBe(201);
    expect((await api('delete', `/admin/admins/${A.user._id}`, { token: A.token })).status).toBe(400);
    expect((await api('delete', `/admin/admins/${second.body._id}`, { token: A.token })).status).toBe(200);
  });

  it('paginates lists', async () => {
    for (const n of [2, 3, 4]) {
      await api('post', '/admin/staff', { token: A.token, body: { username: `waiter${n}`, email: `w${n}@a.com`, password: PASSWORD } });
    }
    const res = await api('get', '/admin/staff', { token: A.token, query: { page: 2, limit: 2 } });
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toEqual({ page: 2, limit: 2, total: 4, totalPages: 2 });
  });

  it("keeps restaurant B away from A's people", async () => {
    expect((await api('get', '/admin/staff', { token: B.token })).body.data).toHaveLength(0);
    expect((await api('delete', `/admin/staff/${staffId}`, { token: B.token })).status).toBe(404);
  });
});

describe('menu, tables and orders', () => {
  it('scopes menu and tables per restaurant', async () => {
    category = (await api('post', '/menu/categories', { token: A.token, body: { name: 'Mains' } })).body;
    const catB = (await api('post', '/menu/categories', { token: B.token, body: { name: 'Pizza' } })).body;
    const created = await request(app).post('/api/v1/menu/items').set('Authorization', `Bearer ${A.token}`)
      .field('name', 'Paneer').field('price', '200').field('categoryId', category._id).field('availability', 'true');
    expect(created.status).toBe(201);
    item = created.body;

    const foreign = await request(app).post('/api/v1/menu/items').set('Authorization', `Bearer ${A.token}`)
      .field('name', 'Hack').field('price', '1').field('categoryId', catB._id);
    expect(foreign.status).toBe(400);
    expect((await api('get', '/menu/items', { token: B.token })).body.data).toHaveLength(0);
    expect((await api('put', `/menu/items/${item._id}`, { token: B.token, body: { availability: false } })).status).toBe(404);

    expect((await api('post', '/tables', { token: A.token, body: { number: 1 } })).status).toBe(201);
    expect((await api('post', '/tables', { token: B.token, body: { number: 1 } })).status).toBe(201);
    expect((await api('post', '/tables', { token: A.token, body: { number: 1 } })).status).toBe(409);
  });

  it('generates a QR url that names the restaurant', async () => {
    const [table] = (await api('get', '/tables', { token: A.token })).body.data;
    const res = await api('get', `/tables/${table._id}/qr`, { token: A.token });
    expect(res.body.qrUrl).toContain(`r=${A.restaurant._id}`);
    expect(res.body.qrUrl).toContain('table=table-1');
  });

  it('lets a guest order without logging in, only from the right restaurant', async () => {
    const rid = A.restaurant._id;
    expect((await api('get', `/public/restaurants/${rid}/menu`)).body.items).toHaveLength(1);
    expect((await api('post', `/public/restaurants/${B.restaurant._id}/orders`, { body: { tableId: 1, items: [{ menuItemId: item._id, qty: 1 }] } })).status).toBe(400);
    expect((await api('post', `/public/restaurants/${rid}/orders`, { body: { tableId: 1, items: [{ menuItemId: item._id, qty: -2 }] } })).status).toBe(400);
    const placed = await api('post', `/public/restaurants/${rid}/orders`, { body: { tableId: 1, items: [{ menuItemId: item._id, qty: 2 }] } });
    expect(placed.status).toBe(201);
    expect(placed.body.totals).toBe(400);
    expect((await api('get', `/public/restaurants/${rid}/orders`, { query: { table: 'table-1' } })).body.data).toHaveLength(1);
  });

  it('shows staff only their restaurant orders and lets them update status', async () => {
    const orders = (await api('get', '/orders', { token: staffToken })).body;
    expect(orders.data).toHaveLength(1);
    expect((await api('get', '/orders', { token: B.token })).body.data).toHaveLength(0);
    const id = orders.data[0]._id;
    expect((await api('patch', `/orders/${id}/status`, { token: staffToken, body: { status: 'preparing' } })).body.status).toBe('preparing');
    expect((await api('patch', `/orders/${id}/status`, { token: B.token, body: { status: 'ready' } })).status).toBe(404);
    const stats = (await api('get', '/orders/analytics', { token: A.token })).body;
    expect(stats.totalRevenue).toBe(400);
  });

  it('routes staff queries to their own restaurant admins', async () => {
    expect((await api('post', '/auth/queries', { token: staffToken, body: { message: 'need leave' } })).status).toBe(201);
    expect((await api('get', '/auth/queries', { token: A.token })).body.data).toHaveLength(1);
    expect((await api('get', '/auth/queries', { token: B.token })).body.data).toHaveLength(0);
  });
});

describe('superadmin', () => {
  it('reports totals and per-restaurant stats', async () => {
    const { totals } = (await api('get', '/superadmin/overview', { token: superToken })).body;
    expect(totals).toMatchObject({ restaurants: 2, active: 2, locked: 0 });
    const list = (await api('get', '/superadmin/restaurants', { token: superToken })).body;
    const row = list.data.find((r) => r._id === A.restaurant._id);
    expect(row).toMatchObject({ staff: 4, tables: 1 })
    expect(row.admins).toHaveLength(1);
    expect(row.admins[0]).toEqual({ username: expect.any(String), email: expect.any(String) });;
    expect(list.pagination.total).toBe(2);
  });

  it('searches restaurants by name', async () => {
    const res = await api('get', '/superadmin/restaurants', { token: superToken, query: { search: 'resto b' } });
    expect(res.body.data).toHaveLength(1);
  });

  it('shows restaurant detail', async () => {
    const res = await api('get', `/superadmin/restaurants/${A.restaurant._id}`, { token: superToken });
    expect(res.body.admins).toHaveLength(1);
    expect(res.body.staff).toHaveLength(4);
    expect(res.body.recentOrders).toHaveLength(1);
  });

  it('creates admins for an existing or brand-new restaurant, rolling back on conflict', async () => {
    const fresh = await api('post', '/superadmin/admins', { token: superToken, body: { username: 'newone', email: 'n@new.com', password: PASSWORD, restaurantName: 'New Cafe' } });
    expect(fresh.status).toBe(201);
    const existing = await api('post', '/superadmin/admins', { token: superToken, body: { username: 'third', email: 't@a.com', password: PASSWORD, restaurantId: A.restaurant._id } });
    expect(existing.status).toBe(201);
    expect((await api('post', '/superadmin/admins', { token: superToken, body: { username: 'bad', email: 'bad@x.com', password: PASSWORD } })).status).toBe(400);
    const dup = await api('post', '/superadmin/admins', { token: superToken, body: { username: 'newone', email: 'z@new.com', password: PASSWORD, restaurantName: 'Orphan' } });
    expect(dup.status).toBe(409);
    const names = (await api('get', '/superadmin/restaurants', { token: superToken, query: { search: 'Orphan' } })).body.data;
    expect(names).toHaveLength(0);
  });
});

describe('platform', () => {
  it('serves Swagger at /api and 404s unknown routes as JSON', async () => {
    const docs = await request(app).get('/api/');
    expect(docs.status).toBe(200);
    expect(docs.text).toContain('swagger-ui');
    const missing = await request(app).get('/api/v1/nope');
    expect(missing.status).toBe(404);
    expect(missing.body.message).toBeDefined();
  });

  it('sends security headers', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
