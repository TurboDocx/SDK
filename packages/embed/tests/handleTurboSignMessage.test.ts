import {
  handleTurboSignMessage,
  TURBOSIGN_COMPLETED,
  TURBOSIGN_DECLINED,
  TURBOSIGN_ERROR,
} from '../src/handleTurboSignMessage.js';

/**
 * Unit tests for the pure message handler, the load-bearing logic shared by the web component and the
 * React component. No DOM is required here; the handler reads only `{ origin, data }`.
 */
describe('handleTurboSignMessage', () => {
  const EXPECTED_ORIGIN = 'https://app.turbodocx.com';

  describe('origin pinning', () => {
    it('ignores a message whose origin does not match the configured expectedOrigin', () => {
      // Arrange: a valid completed payload but from the WRONG origin.
      const onCompleted = jest.fn();
      // Act
      handleTurboSignMessage(
        { origin: 'https://evil.example.com', data: { type: TURBOSIGN_COMPLETED, documentId: 'doc_1' } },
        { expectedOrigin: EXPECTED_ORIGIN, onCompleted },
      );
      // Assert: origin mismatch => handler never fires.
      expect(onCompleted).not.toHaveBeenCalled();
    });

    it('fires when the origin matches the configured expectedOrigin', () => {
      // Arrange
      const onCompleted = jest.fn();
      // Act
      handleTurboSignMessage(
        { origin: EXPECTED_ORIGIN, data: { type: TURBOSIGN_COMPLETED, documentId: 'doc_1' } },
        { expectedOrigin: EXPECTED_ORIGIN, onCompleted },
      );
      // Assert
      expect(onCompleted).toHaveBeenCalledTimes(1);
    });

    it('accepts any origin when expectedOrigin is undefined (dev convenience)', () => {
      const onCompleted = jest.fn();
      handleTurboSignMessage(
        { origin: 'https://anything.example.com', data: { type: TURBOSIGN_COMPLETED, documentId: 'doc_2' } },
        { onCompleted },
      );
      expect(onCompleted).toHaveBeenCalledWith({ documentId: 'doc_2', status: undefined });
    });

    it('accepts any origin when expectedOrigin is null', () => {
      const onCompleted = jest.fn();
      handleTurboSignMessage(
        { origin: 'https://anything.example.com', data: { type: TURBOSIGN_COMPLETED } },
        { expectedOrigin: null, onCompleted },
      );
      expect(onCompleted).toHaveBeenCalledTimes(1);
    });

    it('FAILS OPEN on an empty-string expectedOrigin (documented risk): accepts any origin', () => {
      // An empty `origin=""` attribute on <turbosign-form> is treated as "not configured".
      const onCompleted = jest.fn();
      handleTurboSignMessage(
        { origin: 'https://anything.example.com', data: { type: TURBOSIGN_COMPLETED } },
        { expectedOrigin: '', onCompleted },
      );
      expect(onCompleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispatch on event.data.type', () => {
    it('calls onCompleted with the documentId from a turbosign:completed message', () => {
      const onCompleted = jest.fn();
      handleTurboSignMessage(
        { origin: EXPECTED_ORIGIN, data: { type: TURBOSIGN_COMPLETED, documentId: 'doc_42', status: 'completed' } },
        { expectedOrigin: EXPECTED_ORIGIN, onCompleted },
      );
      expect(onCompleted).toHaveBeenCalledWith({ documentId: 'doc_42', status: 'completed' });
    });

    it('calls onDeclined for a turbosign:declined message', () => {
      const onDeclined = jest.fn();
      const onCompleted = jest.fn();
      handleTurboSignMessage(
        { origin: EXPECTED_ORIGIN, data: { type: TURBOSIGN_DECLINED, documentId: 'doc_9' } },
        { expectedOrigin: EXPECTED_ORIGIN, onDeclined, onCompleted },
      );
      expect(onDeclined).toHaveBeenCalledWith({ documentId: 'doc_9', status: undefined });
      expect(onCompleted).not.toHaveBeenCalled();
    });

    it('calls onError for a turbosign:error message and forwards the raw error', () => {
      const onError = jest.fn();
      handleTurboSignMessage(
        { origin: EXPECTED_ORIGIN, data: { type: TURBOSIGN_ERROR, error: 'boom' } },
        { expectedOrigin: EXPECTED_ORIGIN, onError },
      );
      expect(onError).toHaveBeenCalledWith({ documentId: undefined, status: undefined, error: 'boom' });
    });
  });

  // The signing page reports WHAT completed: `event` tells a fresh signature from a reopened link the
  // signer had already completed, and `scope: "recipient"` says it is this signer's step (not the
  // whole document). Both must reach the host, or a kiosk can't tell "just signed" from "already done".
  describe('completion detail from the signing page', () => {
    it('passes event and scope through to onCompleted', () => {
      const onCompleted = jest.fn();
      handleTurboSignMessage(
        {
          origin: EXPECTED_ORIGIN,
          data: {
            type: TURBOSIGN_COMPLETED,
            documentId: 'doc_9',
            status: 'completed',
            event: 'signing_complete',
            scope: 'recipient',
          },
        },
        { expectedOrigin: EXPECTED_ORIGIN, onCompleted },
      );
      expect(onCompleted).toHaveBeenCalledWith({
        documentId: 'doc_9',
        status: 'completed',
        event: 'signing_complete',
        scope: 'recipient',
      });
    });

    it('reports a reopened, already-signed link as event "already_signed"', () => {
      const onCompleted = jest.fn();
      handleTurboSignMessage(
        {
          origin: EXPECTED_ORIGIN,
          data: { type: TURBOSIGN_COMPLETED, status: 'completed', event: 'already_signed', scope: 'recipient' },
        },
        { expectedOrigin: EXPECTED_ORIGIN, onCompleted },
      );
      expect(onCompleted.mock.calls[0][0].event).toBe('already_signed');
    });

    it('drops non-string event / scope values rather than forwarding them', () => {
      const onCompleted = jest.fn();
      handleTurboSignMessage(
        { origin: EXPECTED_ORIGIN, data: { type: TURBOSIGN_COMPLETED, event: 42, scope: { x: 1 } } },
        { expectedOrigin: EXPECTED_ORIGIN, onCompleted },
      );
      const result = onCompleted.mock.calls[0][0];
      expect(result.event).toBeUndefined();
      expect(result.scope).toBeUndefined();
    });
  });

  describe('ignores unrelated / malformed messages silently', () => {
    it('ignores a message with an unrelated type', () => {
      const onCompleted = jest.fn();
      handleTurboSignMessage(
        { origin: EXPECTED_ORIGIN, data: { type: 'webpack:hot-update' } },
        { expectedOrigin: EXPECTED_ORIGIN, onCompleted },
      );
      expect(onCompleted).not.toHaveBeenCalled();
    });

    it('ignores non-object data (string)', () => {
      const onCompleted = jest.fn();
      expect(() =>
        handleTurboSignMessage(
          { origin: EXPECTED_ORIGIN, data: 'just a string' },
          { expectedOrigin: EXPECTED_ORIGIN, onCompleted },
        ),
      ).not.toThrow();
      expect(onCompleted).not.toHaveBeenCalled();
    });

    it('ignores data with a non-string type', () => {
      const onCompleted = jest.fn();
      handleTurboSignMessage(
        { origin: EXPECTED_ORIGIN, data: { type: 123 } },
        { expectedOrigin: EXPECTED_ORIGIN, onCompleted },
      );
      expect(onCompleted).not.toHaveBeenCalled();
    });

    it('ignores null data', () => {
      const onCompleted = jest.fn();
      handleTurboSignMessage(
        { origin: EXPECTED_ORIGIN, data: null },
        { expectedOrigin: EXPECTED_ORIGIN, onCompleted },
      );
      expect(onCompleted).not.toHaveBeenCalled();
    });
  });
});
