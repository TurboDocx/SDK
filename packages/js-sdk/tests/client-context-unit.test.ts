/**
 * Unit tests for the client-context header builders (the pure functions behind
 * the HTTP client's context headers). These pin two contract guarantees that
 * were tightened after review:
 *   1. Header values are stripped of CR/LF and control chars so a malformed
 *      hostname/timezone/locale (or caller ipAddress) can't corrupt the header
 *      or make the transport reject every request at send time.
 *   2. The device fingerprint is derived from hostname/OS/arch only (no total
 *      memory), matching the cross-SDK contract and staying stable across
 *      VM-resize / cgroup memory-limit changes.
 */

import { buildDeviceFingerprint, resolveClientContextHeaders } from '../src/utils/client-context';

describe('resolveClientContextHeaders — value sanitization', () => {
  it('strips CR/LF and control chars from a caller-supplied User-Agent', () => {
    const headers = resolveClientContextHeaders({ userAgent: 'my-app/1.0\r\nX-Injected: evil' });
    expect(headers['User-Agent']).toBe('my-app/1.0X-Injected: evil');
    expect(headers['User-Agent']).not.toMatch(/[\r\n]/);
  });

  it('strips CR/LF from a caller-supplied ipAddress (X-Forwarded-For)', () => {
    const headers = resolveClientContextHeaders({ ipAddress: '1.2.3.4\r\nX-Evil: 1' });
    expect(headers['X-Forwarded-For']).toBe('1.2.3.4X-Evil: 1');
    expect(headers['X-Forwarded-For']).not.toMatch(/[\r\n]/);
  });

  it('drops X-Forwarded-For when the ipAddress sanitizes to empty', () => {
    const headers = resolveClientContextHeaders({ ipAddress: '\r\n\t' });
    expect(headers['X-Forwarded-For']).toBeUndefined();
  });

  it('sanitizes an override timezone and language', () => {
    const headers = resolveClientContextHeaders({ timezone: 'Europe/Paris\n', language: 'fr-FR\r' });
    expect(headers['X-Timezone']).toBe('Europe/Paris');
    expect(headers['Accept-Language']).toBe('fr-FR');
  });
});

describe('buildDeviceFingerprint — stability contract', () => {
  it('produces a stable SHA-256 hex string that does not depend on total memory', () => {
    const os = require('os');
    const spy = jest.spyOn(os, 'totalmem');

    const first = buildDeviceFingerprint();
    // Simulate a memory-limit / VM resize: totalmem changes but the fingerprint
    // must not, since the seed is hostname|OS|arch only.
    spy.mockReturnValue(999_999_999);
    const afterResize = buildDeviceFingerprint();

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(afterResize).toBe(first);

    spy.mockRestore();
  });
});
