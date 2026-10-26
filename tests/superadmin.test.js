const { PASSWORD, setupDb, teardownDb, api, signupRestaurant } = require('./helpers');

let superToken, A, B, starter, pro;

beforeAll(async () => {
  await setupDb();
  superToken = (await api('post', '/auth/login', { body: { identifier: 'superadmin', password: 'manishS_13' } })).body.accessToken;
  A = await signupRestaurant('a');
  B = await signupRestaurant('b');
  const plans = (await api('get', '/superadmin/plans', { token: superToken })).body.data;
  starter = plans.find((p) => p.name === 'Starter');
  pro = plans.find((p) => p.name === 'Pro');
});
afterAll(teardownDb);

describe('plans and settings', () => {
  it('seeds starter plans and puts new signups on the default plan with a trial', async () => {
    expect(starter.isDefault).toBe(true);
    const detail = await api('get', `/superadmin/restaurants/${A.restaurant._id}`, { token: superToken });
    expect(detail.body.restaurant.plan.name).toBe('Starter');
    expect(detail.body.restaurant.trialEndsAt).toBeTruthy();
  });

  it('validates and creates plans, rejects duplicates and in-use deletes', async () => {
    expect((await api('post', '/superadmin/plans', { token: superToken, body: { name: 'Bad', monthlyPrice: -5, annualPrice: 1 } })).status).toBe(400);
    expect((await api('post', '/superadmin/plans', { token: superToken, body: { name: 'Pro', monthlyPrice: 10, annualPrice: 100 } })).status).toBe(409);
    const made = await api('post', '/superadmin/plans', { token: superToken, body: { name: 'Mini', monthlyPrice: 99, annualPrice: 990, maxQrs: 5, maxStaff: '', points: [{ text: 'One', show: true }] } });
    expect(made.status).toBe(201);
    expect((await api('delete', `/superadmin/plans/${starter._id}`, { token: superToken })).status).toBe(409);
    expect((await api('delete', `/superadmin/plans/${made.body._id}`, { token: superToken })).status).toBe(200);
  });

  it('is closed to other roles', async () => {
    expect((await api('get', '/superadmin/plans', { token: A.token })).status).toBe(403);
    expect((await api('get', '/superadmin/settings', { token: A.token })).status).toBe(403);
  });

  it('closes public signup when disabled', async () => {
    const off = await api('put', '/superadmin/settings', { token: superToken, body: { allowSignups: false } });
    expect(off.body.allowSignups).toBe(false);
    expect((await api('post', '/auth/signup', { body: { restaurantName: 'Late', email: 'late@x.com', username: 'late_admin', password: PASSWORD } })).status).toBe(403);
    await api('put', '/superadmin/settings', { token: superToken, body: { allowSignups: true } });
  });
});

describe('suspension', () => {
  it('blocks login and existing tokens, and reactivation restores access', async () => {
    expect((await api('patch', `/superadmin/restaurants/${B.restaurant._id}`, { token: superToken, body: { status: 'suspended' } })).status).toBe(200);
    expect((await api('post', '/auth/login', { body: { identifier: 'admin_b', password: PASSWORD } })).status).toBe(403);
    expect((await api('get', '/auth/me', { token: B.token })).status).toBe(403);
    await api('patch', `/superadmin/restaurants/${B.restaurant._id}`, { token: superToken, body: { status: 'active' } });
    expect((await api('get', '/auth/me', { token: B.token })).status).toBe(200);
  });

  it('filters the restaurant list by status and plan', async () => {
    await api('patch', `/superadmin/restaurants/${B.restaurant._id}`, { token: superToken, body: { planId: pro._id, status: 'suspended' } });
    const res = await api('get', '/superadmin/restaurants', { token: superToken, query: { status: 'suspended', planId: pro._id } });
    expect(res.body.data.map((r) => r.name)).toEqual(['Resto b']);
    await api('patch', `/superadmin/restaurants/${B.restaurant._id}`, { token: superToken, body: { status: 'active' } });
  });
});

describe('billing', () => {
  const create = (body) => api('post', '/superadmin/invoices', { token: superToken, body });
  const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  const items = [{ kind: 'qrs', quantity: 20, rate: 10 }, { kind: 'dishes', quantity: 100, rate: 3 }];

  it('bills plan + items less a discount and applies the items to the restaurant', async () => {
    const res = await create({ restaurantId: A.restaurant._id, planId: pro._id, cycle: 'monthly', dueDate: inDays(30), items, discount: { type: 'percent', value: 10 } });
    expect(res.status).toBe(201);
    expect(res.body.subscriptionFee).toBe(pro.monthlyPrice);
    expect(res.body.amount).toBeCloseTo((pro.monthlyPrice + 500) * 0.9, 2);
    const annual = await create({ restaurantId: B.restaurant._id, planId: pro._id, cycle: 'annual', dueDate: inDays(365), discount: { type: 'amount', value: 100 } });
    expect(annual.status).toBe(201);
    expect(annual.body.amount).toBe(pro.annualPrice - 100);
    const detail = await api('get', `/superadmin/restaurants/${A.restaurant._id}`, { token: superToken });
    expect(detail.body.restaurant.plan.name).toBe('Pro');
    expect(detail.body.restaurant.extras).toEqual({ qrs: 20, staff: 0, dishes: 100 });
  });

  it('limits the date to the billing cycle and rejects bad items and discounts', async () => {
    const base = { restaurantId: B.restaurant._id, planId: pro._id, cycle: 'monthly', dueDate: inDays(10) };
    expect((await create({ ...base, dueDate: inDays(45) })).status).toBe(400);
    expect((await create({ ...base, dueDate: inDays(-10) })).status).toBe(400);
    expect((await create({ ...base, items: [{ kind: 'qrs', quantity: 0, rate: 1 }] })).status).toBe(400);
    expect((await create({ ...base, items: [{ kind: 'qrs', quantity: 1, rate: 1 }, { kind: 'qrs', quantity: 2, rate: 1 }] })).status).toBe(400);
    expect((await create({ ...base, discount: { type: 'percent', value: 150 } })).status).toBe(400);
    expect((await create({ ...base, discount: { type: 'amount', value: 9999999 } })).status).toBe(400);
  });

  it('lists, filters and settles invoices', async () => {
    await create({ restaurantId: B.restaurant._id, planId: starter._id, cycle: 'monthly', dueDate: inDays(5) });
    await require('../models/Invoice').updateMany({}, { dueDate: new Date('2025-02-01') });
    const list = await api('get', '/superadmin/invoices', { token: superToken, query: { status: 'overdue' } });
    expect(list.body.data).toHaveLength(3);
    const inv = list.body.data.find((i) => i.restaurant._id === A.restaurant._id);
    expect(inv.restaurant.adminEmail).toBeTruthy();
    const paid = await api('patch', `/superadmin/invoices/${inv._id}`, { token: superToken, body: { status: 'paid' } });
    expect(paid.body.paidAt).toBeTruthy();
    const summary = await api('get', '/superadmin/billing/summary', { token: superToken });
    expect(summary.body.overdue.count).toBe(2);
    expect(summary.body.collectedAllTime).toBe(inv.amount);
  });
});

describe('analytics', () => {
  it('returns a zero-filled series for the requested range', async () => {
    const res = await api('get', '/superadmin/analytics', { token: superToken, query: { from: '2026-01-01', to: '2026-01-07' } });
    expect(res.status).toBe(200);
    expect(res.body.feesSeries).toHaveLength(7);
    expect(res.body.usersSeries).toHaveLength(7);
    expect(res.body.restaurants.total).toBe(2);
    expect(res.body.users).toMatchObject({ locked: 0 });
    expect(res.body.users.total).toBe(res.body.users.admins + res.body.users.staff);
    expect(typeof res.body.totalPlans).toBe('number');
  });

  it('switches to a monthly series for long ranges and rejects bad ranges', async () => {
    const year = await api('get', '/superadmin/analytics', { token: superToken, query: { from: '2026-01-01', to: '2026-12-31' } });
    expect(year.body.granularity).toBe('month');
    expect(year.body.feesSeries).toHaveLength(12);
    for (const query of [{ from: '2026-02-30' }, { from: '2026-05-02', to: '2026-05-01' }, { from: '2020-01-01', to: '2026-01-01' }]) {
      const bad = await api('get', '/superadmin/analytics', { token: superToken, query });
      expect(bad.status).toBe(400);
    }
  });
});
