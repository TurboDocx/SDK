import { TurboSignFormElement, defineTurboSignForm, TURBOSIGN_FORM_TAG } from '../src/TurboSignFormElement.js';
import { TURBOSIGN_COMPLETED } from '../src/handleTurboSignMessage.js';

/**
 * DOM/render tests for the <turbosign-form> web component (jsdom). Importing the module auto-registers
 * the element via defineTurboSignForm(); we assert render + origin-pinned event re-emission.
 */
describe('<turbosign-form> web component', () => {
  const EXPECTED_ORIGIN = 'https://app.turbodocx.com';
  const EMBED_URL = 'https://app.turbodocx.com/sign/abc123';

  /** Mount a <turbosign-form> with the given attributes and return it plus its iframe window. */
  function mount(attrs: Record<string, string>): { el: HTMLElement; frameWindow: Window | null } {
    const el = document.createElement(TURBOSIGN_FORM_TAG);
    for (const [name, value] of Object.entries(attrs)) {
      el.setAttribute(name, value);
    }
    document.body.appendChild(el);
    return { el, frameWindow: el.querySelector('iframe')?.contentWindow ?? null };
  }

  /** Post a message to window as if it came from `source` at `origin`. */
  function post(origin: string, source: Window | null, data: unknown): void {
    window.dispatchEvent(new MessageEvent('message', { origin, source, data }));
  }

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

    // Act: simulate the signing page (the element's own iframe) posting completion from the expected origin.
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: EXPECTED_ORIGIN,
        source: el.querySelector('iframe')!.contentWindow,
        data: {
          type: TURBOSIGN_COMPLETED,
          documentId: 'doc_777',
          status: 'completed',
          event: 'signing_complete',
          scope: 'recipient',
        },
      }),
    );

    // Assert: the DOM CustomEvent fired with the parsed detail.
    expect(onCompleted).toHaveBeenCalledTimes(1);
    const evt = onCompleted.mock.calls[0][0] as CustomEvent;
    expect(evt.detail).toEqual({
      documentId: 'doc_777',
      status: 'completed',
      event: 'signing_complete',
      scope: 'recipient',
    });
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

    const frameWindow = el.querySelector('iframe')!.contentWindow;
    el.remove();
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: EXPECTED_ORIGIN,
        source: frameWindow,
        data: { type: TURBOSIGN_COMPLETED, documentId: 'doc_777' },
      }),
    );

    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('wrong-origin test uses the real frame source, so only the origin differs', () => {
    const { el, frameWindow } = mount({ 'embed-url': EMBED_URL, origin: EXPECTED_ORIGIN });
    const onCompleted = jest.fn();
    el.addEventListener(TURBOSIGN_COMPLETED, onCompleted as EventListener);
    post('https://evil.example.com', frameWindow, { type: TURBOSIGN_COMPLETED });
    expect(onCompleted).not.toHaveBeenCalled();
  });

  describe('fails closed without an origin', () => {
    it('ignores every message when no origin attribute is set', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { el, frameWindow } = mount({ 'embed-url': EMBED_URL });
      const onCompleted = jest.fn();
      el.addEventListener(TURBOSIGN_COMPLETED, onCompleted as EventListener);
      post(EXPECTED_ORIGIN, frameWindow, { type: TURBOSIGN_COMPLETED });
      expect(onCompleted).not.toHaveBeenCalled();
    });

    it('ignores every message when the origin attribute is empty', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { el, frameWindow } = mount({ 'embed-url': EMBED_URL, origin: '' });
      const onCompleted = jest.fn();
      el.addEventListener(TURBOSIGN_COMPLETED, onCompleted as EventListener);
      post(EXPECTED_ORIGIN, frameWindow, { type: TURBOSIGN_COMPLETED });
      expect(onCompleted).not.toHaveBeenCalled();
    });

    it('warns once (not per message) when messages are ignored for a missing origin', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { frameWindow } = mount({ 'embed-url': EMBED_URL });
      post(EXPECTED_ORIGIN, frameWindow, { type: TURBOSIGN_COMPLETED });
      post(EXPECTED_ORIGIN, frameWindow, { type: TURBOSIGN_COMPLETED });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toMatch(/origin/);
    });

    it('does not warn when an origin is pinned', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { frameWindow } = mount({ 'embed-url': EMBED_URL, origin: EXPECTED_ORIGIN });
      post(EXPECTED_ORIGIN, frameWindow, { type: TURBOSIGN_COMPLETED });
      expect(warn).not.toHaveBeenCalled();
    });

    it('accepts any origin with the dev-only allow-any-origin attribute', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { el, frameWindow } = mount({ 'embed-url': EMBED_URL, 'allow-any-origin': '' });
      const onCompleted = jest.fn();
      el.addEventListener(TURBOSIGN_COMPLETED, onCompleted as EventListener);
      post('https://anything.example.com', frameWindow, { type: TURBOSIGN_COMPLETED, documentId: 'doc_dev' });
      expect(onCompleted).toHaveBeenCalledTimes(1);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('message source check', () => {
    it('ignores a pinned-origin message that did not come from its own iframe', () => {
      const { el } = mount({ 'embed-url': EMBED_URL, origin: EXPECTED_ORIGIN });
      const onCompleted = jest.fn();
      el.addEventListener(TURBOSIGN_COMPLETED, onCompleted as EventListener);
      // Same origin, but posted by another window (here: the host window itself) and with no source.
      post(EXPECTED_ORIGIN, window, { type: TURBOSIGN_COMPLETED });
      post(EXPECTED_ORIGIN, null, { type: TURBOSIGN_COMPLETED });
      expect(onCompleted).not.toHaveBeenCalled();
    });

    it("ignores a message from another form's iframe", () => {
      const first = mount({ 'embed-url': EMBED_URL, origin: EXPECTED_ORIGIN });
      const second = mount({ 'embed-url': EMBED_URL, origin: EXPECTED_ORIGIN });
      const onFirst = jest.fn();
      first.el.addEventListener(TURBOSIGN_COMPLETED, onFirst as EventListener);
      post(EXPECTED_ORIGIN, second.frameWindow, { type: TURBOSIGN_COMPLETED });
      expect(onFirst).not.toHaveBeenCalled();
    });

    it('still checks the source under allow-any-origin', () => {
      const { el } = mount({ 'embed-url': EMBED_URL, 'allow-any-origin': '' });
      const onCompleted = jest.fn();
      el.addEventListener(TURBOSIGN_COMPLETED, onCompleted as EventListener);
      post('https://anything.example.com', window, { type: TURBOSIGN_COMPLETED });
      expect(onCompleted).not.toHaveBeenCalled();
    });
  });

  describe('title attribute', () => {
    it('defaults the iframe title to "TurboSign signing"', () => {
      const { el } = mount({ 'embed-url': EMBED_URL, origin: EXPECTED_ORIGIN });
      expect(el.querySelector('iframe')?.title).toBe('TurboSign signing');
    });

    it('uses the title attribute as the iframe title, including changes after connect', () => {
      const { el } = mount({ 'embed-url': EMBED_URL, origin: EXPECTED_ORIGIN, title: 'Sign your lease' });
      expect(el.querySelector('iframe')?.title).toBe('Sign your lease');
      el.setAttribute('title', 'Sign your renewal');
      expect(el.querySelector('iframe')?.title).toBe('Sign your renewal');
      el.removeAttribute('title');
      expect(el.querySelector('iframe')?.title).toBe('TurboSign signing');
    });
  });

  it('defineTurboSignForm() is idempotent (no throw on a second call)', () => {
    expect(() => defineTurboSignForm()).not.toThrow();
  });
});
