/**
 * TurboSign reminder + expiration schedule tests
 *
 * Covers the per-document schedule overrides that ride on both send paths, and the
 * `sendReminder` operation.
 *
 * The API takes a duration as `{ value, unit }`. Both send endpoints accept multipart
 * (file upload) and JSON (fileLink / deliverableId / templateId), and multipart has no notion of
 * a nested value — so the SDK serializes each duration to a JSON string on BOTH paths, exactly as
 * it already does for `recipients` and `fields`. The API decodes a JSON-string duration on either
 * content type, so one code path serves both.
 */

import { TurboSign } from '../src/modules/sign';
import { HttpClient } from '../src/http';
import type { Recipient, Field } from '../src/types/sign';

jest.mock('../src/http');

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe('TurboSign schedule overrides', () => {
  const recipients: Recipient[] = [{ name: 'John Doe', email: 'john@example.com', signingOrder: 1 }];
  const fields: Field[] = [
    { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientEmail: 'john@example.com' },
  ];

  let postMock: jest.Mock;
  let getMock: jest.Mock;
  let uploadMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (TurboSign as any).client = undefined;
    // Stub the prototype BEFORE configure() — configure() constructs the client, and the
    // auto-mocked instance captures its methods at construction time.
    postMock = jest.fn().mockResolvedValue({});
    getMock = jest.fn().mockResolvedValue({});
    uploadMock = jest.fn().mockResolvedValue({});
    MockedHttpClient.prototype.post = postMock;
    MockedHttpClient.prototype.get = getMock;
    MockedHttpClient.prototype.uploadFile = uploadMock;
    MockedHttpClient.prototype.getSenderConfig = jest
      .fn()
      .mockReturnValue({ senderEmail: 'sender@company.com', senderName: 'Sender' });
    TurboSign.configure({ apiKey: 'test-key', orgId: 'org-1', senderEmail: 'sender@company.com' });
  });

  describe('sendSignature — JSON path (deliverableId)', () => {
    it('should send every schedule field the API accepts', async () => {
      postMock.mockResolvedValue({ success: true, documentId: 'doc-1', status: 'under_review', message: 'ok' });

      await TurboSign.sendSignature({
        deliverableId: 'deliv-1',
        recipients,
        fields,
        remindersEnabled: true,
        reminderDelay: { value: 3, unit: 'days' },
        reminderInterval: { value: 12, unit: 'hours' },
        maxReminders: 5,
        expirationEnabled: true,
        expireAfter: { value: 30, unit: 'days' },
        expirationWarning: { value: 3, unit: 'days' },
        expirationWarningInterval: { value: 1, unit: 'days' },
      });

      const body = postMock.mock.calls[0][1];
      expect(body.remindersEnabled).toBe(true);
      expect(body.maxReminders).toBe(5);
      expect(body.expirationEnabled).toBe(true);
      // Durations are JSON-encoded — the API decodes them on both content types.
      expect(body.reminderDelay).toBe('{"value":3,"unit":"days"}');
      expect(body.reminderInterval).toBe('{"value":12,"unit":"hours"}');
      expect(body.expireAfter).toBe('{"value":30,"unit":"days"}');
      expect(body.expirationWarning).toBe('{"value":3,"unit":"days"}');
      expect(body.expirationWarningInterval).toBe('{"value":1,"unit":"days"}');
    });

    it('should omit every schedule key when the caller sets none, so the org defaults apply', async () => {
      postMock.mockResolvedValue({ success: true, documentId: 'doc-1', status: 'under_review', message: 'ok' });

      await TurboSign.sendSignature({ deliverableId: 'deliv-1', recipients, fields });

      const body = postMock.mock.calls[0][1];
      for (const key of [
        'remindersEnabled',
        'reminderDelay',
        'reminderInterval',
        'maxReminders',
        'expirationEnabled',
        'expireAfter',
        'expirationWarning',
        'expirationWarningInterval',
      ]) {
        expect(body).not.toHaveProperty(key);
      }
    });

    // `false` and `0` are meaningful values, not "unset" — a truthiness check would drop them and
    // silently fall back to the org default, which is the opposite of what the caller asked for.
    it('should send remindersEnabled:false rather than dropping it', async () => {
      postMock.mockResolvedValue({ success: true, documentId: 'd', status: 's', message: 'ok' });

      await TurboSign.sendSignature({ deliverableId: 'd', recipients, fields, remindersEnabled: false, expirationEnabled: false });

      expect(postMock.mock.calls[0][1].remindersEnabled).toBe(false);
      expect(postMock.mock.calls[0][1].expirationEnabled).toBe(false);
    });

    it('should send maxReminders:0 (no reminders) and -1 (unlimited) rather than dropping them', async () => {
      postMock.mockResolvedValue({ success: true, documentId: 'd', status: 's', message: 'ok' });

      await TurboSign.sendSignature({ deliverableId: 'd', recipients, fields, maxReminders: 0 });
      expect(postMock.mock.calls[0][1].maxReminders).toBe(0);

      await TurboSign.sendSignature({ deliverableId: 'd', recipients, fields, maxReminders: -1 });
      expect(postMock.mock.calls[1][1].maxReminders).toBe(-1);
    });

    // Zero is legal for the warning offset alone, and means "never warn".
    it('should send a zero expirationWarning, which means no warning emails', async () => {
      postMock.mockResolvedValue({ success: true, documentId: 'd', status: 's', message: 'ok' });

      await TurboSign.sendSignature({ deliverableId: 'd', recipients, fields, expirationWarning: { value: 0, unit: 'hours' } });

      expect(postMock.mock.calls[0][1].expirationWarning).toBe('{"value":0,"unit":"hours"}');
    });
  });

  describe('createSignatureReviewLink — multipart path (file upload)', () => {
    it('should carry the schedule in the multipart form data', async () => {
      uploadMock.mockResolvedValue({ success: true, documentId: 'doc-1', status: 'draft', message: 'ok' });

      await TurboSign.createSignatureReviewLink({
        file: Buffer.from('%PDF-1.4'),
        fileName: 'contract.pdf',
        recipients,
        fields,
        remindersEnabled: true,
        reminderDelay: { value: 2, unit: 'days' },
        expirationEnabled: true,
        expireAfter: { value: 14, unit: 'days' },
      });

      const formData = uploadMock.mock.calls[0][3];
      expect(formData.remindersEnabled).toBe(true);
      expect(formData.reminderDelay).toBe('{"value":2,"unit":"days"}');
      expect(formData.expireAfter).toBe('{"value":14,"unit":"days"}');
    });
  });
});

describe('TurboSign.sendReminder', () => {
  let postMock: jest.Mock;
  let getMock: jest.Mock;
  let uploadMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (TurboSign as any).client = undefined;
    // Stub the prototype BEFORE configure() — configure() constructs the client, and the
    // auto-mocked instance captures its methods at construction time.
    postMock = jest.fn().mockResolvedValue({});
    getMock = jest.fn().mockResolvedValue({});
    uploadMock = jest.fn().mockResolvedValue({});
    MockedHttpClient.prototype.post = postMock;
    MockedHttpClient.prototype.get = getMock;
    MockedHttpClient.prototype.uploadFile = uploadMock;
    MockedHttpClient.prototype.getSenderConfig = jest
      .fn()
      .mockReturnValue({ senderEmail: 'sender@company.com', senderName: 'Sender' });
    TurboSign.configure({ apiKey: 'test-key', orgId: 'org-1', senderEmail: 'sender@company.com' });
  });

  it('should POST to the send-reminder endpoint for the given document', async () => {
      postMock.mockResolvedValue({ results: [] });

    await TurboSign.sendReminder('doc-123');

    expect(postMock).toHaveBeenCalledWith('/turbosign/documents/doc-123/send-reminder', {});
  });

  it('should send an empty body when no recipients are named, so every due signer is reminded', async () => {
      postMock.mockResolvedValue({ results: [] });

    await TurboSign.sendReminder('doc-123');

    // An empty `recipientIds` array would be REJECTED by the API (min 1); the key must be absent.
    expect(postMock.mock.calls[0][1]).not.toHaveProperty('recipientIds');
  });

  it('should pass named recipient ids through when supplied', async () => {
      postMock.mockResolvedValue({ results: [] });

    await TurboSign.sendReminder('doc-123', ['r-1', 'r-2']);

    expect(postMock).toHaveBeenCalledWith('/turbosign/documents/doc-123/send-reminder', {
      recipientIds: ['r-1', 'r-2'],
    });
  });

  // An empty array is a caller mistake the API would 400 on. Treat it as "no filter" instead of
  // forwarding a request that cannot succeed.
  it('should treat an empty recipient list as unfiltered rather than sending a rejected body', async () => {
      postMock.mockResolvedValue({ results: [] });

    await TurboSign.sendReminder('doc-123', []);

    expect(postMock.mock.calls[0][1]).not.toHaveProperty('recipientIds');
  });

  it('should return the per-recipient results the API reports', async () => {
    postMock.mockResolvedValue({
      results: [
        { recipientId: 'r-1', status: 'sent', reminderCount: 2, phase: 'reminder' },
        { recipientId: 'r-2', status: 'skipped_wrong_order' },
      ],
    });

    const result = await TurboSign.sendReminder('doc-123');

    expect(result.results).toHaveLength(2);
    expect(result.results[0].status).toBe('sent');
    expect(result.results[0].reminderCount).toBe(2);
    // A later-order signer is reported, not silently dropped — the caller can tell nobody was emailed.
    expect(result.results[1].status).toBe('skipped_wrong_order');
  });
});

describe('TurboSign document expiry surface', () => {
  let postMock: jest.Mock;
  let getMock: jest.Mock;
  let uploadMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (TurboSign as any).client = undefined;
    // Stub the prototype BEFORE configure() — configure() constructs the client, and the
    // auto-mocked instance captures its methods at construction time.
    postMock = jest.fn().mockResolvedValue({});
    getMock = jest.fn().mockResolvedValue({});
    uploadMock = jest.fn().mockResolvedValue({});
    MockedHttpClient.prototype.post = postMock;
    MockedHttpClient.prototype.get = getMock;
    MockedHttpClient.prototype.uploadFile = uploadMock;
    MockedHttpClient.prototype.getSenderConfig = jest
      .fn()
      .mockReturnValue({ senderEmail: 'sender@company.com', senderName: 'Sender' });
    TurboSign.configure({ apiKey: 'test-key', orgId: 'org-1', senderEmail: 'sender@company.com' });
  });

  it('should surface expiresAt on the status response when the document has a deadline', async () => {
    getMock.mockResolvedValue({ status: 'under_review', expiresAt: '2026-08-02T23:59:59.000Z' });

    const status = await TurboSign.getStatus('doc-1');

    expect(status.expiresAt).toBe('2026-08-02T23:59:59.000Z');
  });

  // Expiration is opt-in, so most documents never expire and the key is simply absent.
  it('should tolerate a status response with no expiresAt', async () => {
    getMock.mockResolvedValue({ status: 'under_review' });

    const status = await TurboSign.getStatus('doc-1');

    expect(status.expiresAt).toBeUndefined();
    expect(status.status).toBe('under_review');
  });

  it('should report the terminal expired status', async () => {
    getMock.mockResolvedValue({ status: 'expired', expiresAt: '2026-01-01T00:00:00.000Z' });

    const status = await TurboSign.getStatus('doc-1');

    expect(status.status).toBe('expired');
  });
});
