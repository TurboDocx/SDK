import { TurboSignFormElement, defineTurboSignForm, TURBOSIGN_FORM_TAG } from '../src/TurboSignFormElement.js';
import { TURBOSIGN_COMPLETED } from '../src/handleTurboSignMessage.js';

/**
 * DOM/render tests for the <turbosign-form> web component (jsdom). Importing the module auto-registers
 * the element via defineTurboSignForm(); we assert render + origin-pinned event re-emission.
 */
describe('<turbosign-form> web component', () => {
  const EXPECTED_ORIGIN = 'https://app.turbodocx.com';
  const EMBED_URL = 'https://app.turbodocx.com/sign/abc123';

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('is registered as a custom element on import', () => {
    // The module's bottom-of-file defineTurboSignForm() call registers it in a browser env.
    expect(customElements.get(TURBOSIGN_FORM_TAG)).toBe(TurboSignFormElement);
  });

  it('renders an iframe whose src is the embed-url attribute', () => {
    // Arrange + Act
    const el = document.createElement(TURBOSIGN_FORM_TAG);
    el.setAttribute('embed-url', EMBED_URL);
    document.body.appendChild(el);

    // Assert: exactly one iframe, pointing at the embed URL, full width, with clipboard-write.
    const iframe = el.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toBe(EMBED_URL);
    expect(iframe?.getAttribute('allow')).toBe('clipboard-write');
    expect(iframe?.style.width).toBe('100%');
  });

  it('updates the iframe src when the embed-url attribute changes after connect', () => {
    const el = document.createElement(TURBOSIGN_FORM_TAG);
    el.setAttribute('embed-url', EMBED_URL);
    document.body.appendChild(el);
    el.setAttribute('embed-url', 'https://app.turbodocx.com/sign/next');
    expect(el.querySelector('iframe')?.getAttribute('src')).toBe('https://app.turbodocx.com/sign/next');
  });

  it('emits a turbosign:completed CustomEvent for a message from the pinned origin', () => {
    // Arrange
    const el = document.createElement(TURBOSIGN_FORM_TAG);
    el.setAttribute('embed-url', EMBED_URL);
    el.setAttribute('origin', EXPECTED_ORIGIN);
    document.body.appendChild(el);
    const onCompleted = jest.fn();
    el.addEventListener(TURBOSIGN_COMPLETED, onCompleted as EventListener);

    // Act: simulate the signing page posting completion from the expected origin.
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: EXPECTED_ORIGIN,
        data: { type: TURBOSIGN_COMPLETED, documentId: 'doc_777', status: 'completed' },
      }),
    );

    // Assert: the DOM CustomEvent fired with the parsed detail.
    expect(onCompleted).toHaveBeenCalledTimes(1);
    const evt = onCompleted.mock.calls[0][0] as CustomEvent;
    expect(evt.detail).toEqual({ documentId: 'doc_777', status: 'completed' });
  });

  it('does NOT emit for a message from a wrong origin (origin pinning)', () => {
    const el = document.createElement(TURBOSIGN_FORM_TAG);
    el.setAttribute('embed-url', EMBED_URL);
    el.setAttribute('origin', EXPECTED_ORIGIN);
    document.body.appendChild(el);
    const onCompleted = jest.fn();
    el.addEventListener(TURBOSIGN_COMPLETED, onCompleted as EventListener);

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.example.com',
        data: { type: TURBOSIGN_COMPLETED, documentId: 'doc_777' },
      }),
    );

    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('stops listening after the element is removed from the DOM', () => {
    const el = document.createElement(TURBOSIGN_FORM_TAG);
    el.setAttribute('embed-url', EMBED_URL);
    el.setAttribute('origin', EXPECTED_ORIGIN);
    document.body.appendChild(el);
    const onCompleted = jest.fn();
    el.addEventListener(TURBOSIGN_COMPLETED, onCompleted as EventListener);

    el.remove();
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: EXPECTED_ORIGIN,
        data: { type: TURBOSIGN_COMPLETED, documentId: 'doc_777' },
      }),
    );

    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('defineTurboSignForm() is idempotent (no throw on a second call)', () => {
    expect(() => defineTurboSignForm()).not.toThrow();
  });
});
