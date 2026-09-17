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
