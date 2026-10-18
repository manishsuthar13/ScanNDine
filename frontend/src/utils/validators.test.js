import {
  detectIdentifierType, validateIdentifier, validateUsername, validatePassword, validatePhone, passwordChecks,
} from './validators';

describe('detectIdentifierType', () => {
  it('treats anything with @ as an email and the rest as a username', () => {
    expect(detectIdentifierType('me@example.com')).toBe('email');
    expect(detectIdentifierType('me@')).toBe('email');
    expect(detectIdentifierType('chef.maria_1')).toBe('username');
    expect(detectIdentifierType('   ')).toBeNull();
  });
});

describe('validateIdentifier', () => {
  it('accepts a valid email or username', () => {
    expect(validateIdentifier('me@example.com')).toBe('');
    expect(validateIdentifier('chef.maria_1')).toBe('');
  });
  it('rejects malformed emails and usernames with symbols', () => {
    expect(validateIdentifier('me@example')).not.toBe('');
    expect(validateIdentifier('chef-maria')).not.toBe('');
    expect(validateIdentifier('chef maria')).not.toBe('');
    expect(validateIdentifier('')).not.toBe('');
  });
});

describe('validateUsername', () => {
  it.each(['ab', 'a'.repeat(31), 'with space', 'dash-name', 'sym$bol'])('rejects %s', (v) => {
    expect(validateUsername(v)).not.toBe('');
  });
  it('allows letters, numbers, underscore and dot', () => {
    expect(validateUsername('Chef_01.b')).toBe('');
  });
});

describe('validatePassword', () => {
  it('requires 8+ characters, a capital and a special character', () => {
    expect(validatePassword('Passw0rd@')).toBe('');
    expect(validatePassword('Short@1')).not.toBe('');
    expect(validatePassword('nocapital@1')).not.toBe('');
    expect(validatePassword('NoSpecial12')).not.toBe('');
  });
  it('reports each rule for the live checklist', () => {
    expect(passwordChecks('abc').map((c) => c.ok)).toEqual([false, false, false]);
    expect(passwordChecks('Abcdefg@').map((c) => c.ok)).toEqual([true, true, true]);
  });
});

describe('validatePhone', () => {
  it('is optional but must look like a phone number when given', () => {
    expect(validatePhone('')).toBe('');
    expect(validatePhone('+91 98765 43210')).toBe('');
    expect(validatePhone('abc')).not.toBe('');
  });
});
