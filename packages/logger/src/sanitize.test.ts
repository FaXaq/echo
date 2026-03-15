import { describe, it, expect } from 'vitest';
import { sanitize } from './sanitize';

describe('sanitize', () => {
  it('redacts known identity PII fields', () => {
    expect(sanitize({ email: 'a@b.com' })).toEqual({ email: '[REDACTED]' });
    expect(sanitize({ password: 'secret' })).toEqual({ password: '[REDACTED]' });
    expect(sanitize({ firstName: 'John' })).toEqual({ firstName: '[REDACTED]' });
    expect(sanitize({ phone: '0612345678' })).toEqual({ phone: '[REDACTED]' });
  });

  it('redacts French healthcare PII fields', () => {
    expect(sanitize({ nir: '1234567890123' })).toEqual({ nir: '[REDACTED]' });
    expect(sanitize({ ins: 'INS123' })).toEqual({ ins: '[REDACTED]' });
    expect(sanitize({ rpps: 'RPPS123' })).toEqual({ rpps: '[REDACTED]' });
  });

  it('redacts auth token fields', () => {
    expect(sanitize({ token: 'tok_123' })).toEqual({ token: '[REDACTED]' });
    expect(sanitize({ accessToken: 'at_123' })).toEqual({ accessToken: '[REDACTED]' });
    expect(sanitize({ refreshToken: 'rt_123' })).toEqual({ refreshToken: '[REDACTED]' });
    expect(sanitize({ apiKey: 'key_123' })).toEqual({ apiKey: '[REDACTED]' });
  });

  it('redacts network PII fields', () => {
    expect(sanitize({ ip: '192.168.1.1' })).toEqual({ ip: '[REDACTED]' });
    expect(sanitize({ userAgent: 'Mozilla/5.0' })).toEqual({ userAgent: '[REDACTED]' });
  });

  it('does not redact non-PII fields', () => {
    expect(sanitize({ userId: '123' })).toEqual({ userId: '123' });
    expect(sanitize({ requestId: 'abc' })).toEqual({ requestId: 'abc' });
    expect(sanitize({ action: 'login' })).toEqual({ action: 'login' });
  });

  it('redacts nested PII fields', () => {
    const result = sanitize({ user: { email: 'a@b.com', id: '1' } });
    expect(result).toEqual({ user: { email: '[REDACTED]', id: '1' } });
  });

  it('redacts deeply nested PII', () => {
    const result = sanitize({ a: { b: { c: { email: 'x@y.com' } } } });
    expect(result).toEqual({ a: { b: { c: { email: '[REDACTED]' } } } });
  });

  it('sanitizes each element in an array of objects', () => {
    const result = sanitize([{ email: 'a@b.com' }, { email: 'c@d.com' }]);
    expect(result).toEqual([{ email: '[REDACTED]' }, { email: '[REDACTED]' }]);
  });

  it('returns primitive values as-is', () => {
    expect(sanitize(42)).toBe(42);
    expect(sanitize(null)).toBe(null);
    expect(sanitize('string')).toBe('string');
    expect(sanitize(true)).toBe(true);
    expect(sanitize(undefined)).toBe(undefined);
  });

  it('is case-insensitive for field name matching', () => {
    expect(sanitize({ Email: 'a@b.com' })).toEqual({ Email: '[REDACTED]' });
    expect(sanitize({ EMAIL: 'a@b.com' })).toEqual({ EMAIL: '[REDACTED]' });
    expect(sanitize({ APIKEY: 'key' })).toEqual({ APIKEY: '[REDACTED]' });
  });

  it('preserves non-PII sibling fields when redacting', () => {
    const result = sanitize({ email: 'a@b.com', userId: '1', action: 'login' });
    expect(result).toEqual({ email: '[REDACTED]', userId: '1', action: 'login' });
  });
});
