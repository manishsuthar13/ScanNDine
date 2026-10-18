const { PASSWORD, setupDb, teardownDb, api, signupRestaurant } = require('./helpers');
const User = require('../models/User');

jest.mock('../utils/mailer', () => ({ sendPasswordReset: jest.fn().mockResolvedValue() }));
const { sendPasswordReset } = require('../utils/mailer');

beforeAll(setupDb);
afterAll(teardownDb);

const signup = (over = {}) => api('post', '/auth/signup', {
  body: { restaurantName: 'Spice Hut', email: 'a@spice.com', username: 'spice.admin', password: PASSWORD, ...over },
});

describe('signup', () => {
  it('creates a restaurant with its first admin and ignores any role sent', async () => {
    const res = await signup({ role: 'superadmin', phone: '+91 98765 43210' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('admin');
    expect(res.body.restaurant.name).toBe('Spice Hut');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it.each([
    ['too short', 'Ab@1'],
    ['no capital letter', 'passw0rd@1'],
    ['no special character', 'Passw0rd1'],
  ])('rejects a password with %s', async (_, password) => {
    const res = await signup({ email: 'x@x.com', username: 'someone', password });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password/i);
  });

  it.each(['has space', 'dash-name', 'at@sign', 'ab'])('rejects username "%s"', async (username) => {
    const res = await signup({ email: 'y@y.com', username });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate username and email with 409', async () => {
    expect((await signup({ email: 'other@spice.com' })).status).toBe(409);
    expect((await signup({ username: 'another' })).status).toBe(409);
  });
});

describe('login', () => {
  it('accepts the superadmin by email or by username in the same field', async () => {
    const byEmail = await api('post', '/auth/login', { body: { identifier: 'manisuthar.10@gmail.com', password: 'manishS_13' } });
    const byName = await api('post', '/auth/login', { body: { identifier: 'SuperAdmin', password: 'manishS_13' } });
    expect(byEmail.body.user.role).toBe('superadmin');
    expect(byName.status).toBe(200);
  });

  it('does not treat an email-looking identifier as a username', async () => {
    const res = await api('post', '/auth/login', { body: { identifier: 'superadmin@nowhere.com', password: 'manishS_13' } });
    expect(res.status).toBe(401);
  });

  it('rejects a wrong password', async () => {
    const res = await api('post', '/auth/login', { body: { identifier: 'spice.admin', password: 'nope' } });
    expect(res.status).toBe(401);
  });
});

describe('forgot / reset password', () => {
  const newPassword = 'Brand#New9';

  it('answers the same whether or not the account exists', async () => {
    const known = await api('post', '/auth/forgot-password', { body: { identifier: 'spice.admin' } });
    const unknown = await api('post', '/auth/forgot-password', { body: { identifier: 'ghost.user' } });
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual(known.body);
  });

  it('emails a link whose token resets the password once', async () => {
    sendPasswordReset.mockClear();
    await api('post', '/auth/forgot-password', { body: { identifier: 'a@spice.com' } });
    const [, link] = sendPasswordReset.mock.calls[0];
    const token = new URL(link).searchParams.get('token');

    const weak = await api('post', '/auth/reset-password', { body: { token, password: 'weak' } });
    expect(weak.status).toBe(400);

    const done = await api('post', '/auth/reset-password', { body: { token, password: newPassword } });
    expect(done.status).toBe(200);
    expect((await api('post', '/auth/login', { body: { identifier: 'spice.admin', password: newPassword } })).status).toBe(200);
    expect((await api('post', '/auth/login', { body: { identifier: 'spice.admin', password: PASSWORD } })).status).toBe(401);

    const reused = await api('post', '/auth/reset-password', { body: { token, password: 'Another#Pass1' } });
    expect(reused.status).toBe(400);
  });

  it('rejects an expired token', async () => {
    sendPasswordReset.mockClear();
    await api('post', '/auth/forgot-password', { body: { identifier: 'spice.admin' } });
    const token = new URL(sendPasswordReset.mock.calls[0][1]).searchParams.get('token');
    await User.updateOne({ username: 'spice.admin' }, { resetTokenExpires: new Date(Date.now() - 1000) });
    const res = await api('post', '/auth/reset-password', { body: { token, password: 'Another#Pass1' } });
    expect(res.status).toBe(400);
  });
});

describe('account', () => {
  it('lets a user change their password only with the current one', async () => {
    const { token } = await signupRestaurant('acct');
    const bad = await api('put', '/auth/password', { token, body: { currentPassword: 'wrong', newPassword: 'Newer#Pass1' } });
    expect(bad.status).toBe(400);
    const good = await api('put', '/auth/password', { token, body: { currentPassword: PASSWORD, newPassword: 'Newer#Pass1' } });
    expect(good.status).toBe(200);
  });

  it('requires a token on protected routes', async () => {
    expect((await api('get', '/auth/me')).status).toBe(401);
  });
});
