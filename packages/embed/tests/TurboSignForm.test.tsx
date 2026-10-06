import { createElement } from 'react';
import { render, cleanup } from '@testing-library/react';

import { TurboSignForm } from '../src/TurboSignForm.js';
import { TURBOSIGN_COMPLETED } from '../src/handleTurboSignMessage.js';

/**
 * Render test for the React <TurboSignForm> wrapper (jsdom + React Testing Library). Confirms it
 * renders the iframe and that a message from the pinned origin invokes onCompleted while a wrong-origin
 * message does not.
 */
describe('<TurboSignForm> (React)', () => {
  const EXPECTED_ORIGIN = 'https://app.turbodocx.com';
  const EMBED_URL = 'https://app.turbodocx.com/sign/abc123';

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  /** The rendered iframe's window, which is the only legitimate message source. */
  function frameOf(container: HTMLElement): Window | null {
    return container.querySelector('iframe')?.contentWindow ?? null;
  }

  function post(origin: string, source: Window | null, data: unknown): void {
    window.dispatchEvent(new MessageEvent('message', { origin, source, data }));
  }

  it('renders an iframe with the embedUrl as src', () => {
    const { container } = render(
      createElement(TurboSignForm, { embedUrl: EMBED_URL, onCompleted: jest.fn() }),
    );
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toBe(EMBED_URL);
    expect(iframe?.getAttribute('allow')).toBe('clipboard-write');
  });

  it('calls onCompleted for a message from the pinned origin', () => {
    const onCompleted = jest.fn();
    const { container } = render(
      createElement(TurboSignForm, { embedUrl: EMBED_URL, origin: EXPECTED_ORIGIN, onCompleted }),
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: EXPECTED_ORIGIN,
        source: frameOf(container),
        data: { type: TURBOSIGN_COMPLETED, documentId: 'doc_react', status: 'completed' },
      }),
    );

    expect(onCompleted).toHaveBeenCalledWith({ documentId: 'doc_react', status: 'completed' });
  });

  it('does NOT call onCompleted for a wrong-origin message (origin pinning)', () => {
    const onCompleted = jest.fn();
    render(
      createElement(TurboSignForm, { embedUrl: EMBED_URL, origin: EXPECTED_ORIGIN, onCompleted }),
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.example.com',
        data: { type: TURBOSIGN_COMPLETED, documentId: 'doc_react' },
      }),
    );

    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('removes its message listener on unmount', () => {
    const onCompleted = jest.fn();
    const { container, unmount } = render(
      createElement(TurboSignForm, { embedUrl: EMBED_URL, origin: EXPECTED_ORIGIN, onCompleted }),
    );
    const frameWindow = frameOf(container);
    unmount();

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: EXPECTED_ORIGIN,
        source: frameWindow,
        data: { type: TURBOSIGN_COMPLETED, documentId: 'doc_react' },
      }),
    );

    expect(onCompleted).not.toHaveBeenCalled();
  });

  describe('fails closed without an origin', () => {
    it.each([
      ['omitted', undefined],
      ['null', null],
      ['an empty string', ''],
    ])('ignores every message when origin is %s', (_label, origin) => {
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const onCompleted = jest.fn();
      const { container } = render(createElement(TurboSignForm, { embedUrl: EMBED_URL, origin, onCompleted }));
      post(EXPECTED_ORIGIN, frameOf(container), { type: TURBOSIGN_COMPLETED });
      expect(onCompleted).not.toHaveBeenCalled();
    });

    it('warns once (not per message) when messages are ignored for a missing origin', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { container } = render(createElement(TurboSignForm, { embedUrl: EMBED_URL, onCompleted: jest.fn() }));
      post(EXPECTED_ORIGIN, frameOf(container), { type: TURBOSIGN_COMPLETED });
      post(EXPECTED_ORIGIN, frameOf(container), { type: TURBOSIGN_COMPLETED });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toMatch(/origin/);
    });

    it('does not warn when an origin is pinned', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { container } = render(
        createElement(TurboSignForm, { embedUrl: EMBED_URL, origin: EXPECTED_ORIGIN, onCompleted: jest.fn() }),
      );
      post(EXPECTED_ORIGIN, frameOf(container), { type: TURBOSIGN_COMPLETED });
      expect(warn).not.toHaveBeenCalled();
    });

    it('accepts any origin with the dev-only allowAnyOrigin prop', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const onCompleted = jest.fn();
      const { container } = render(
        createElement(TurboSignForm, { embedUrl: EMBED_URL, allowAnyOrigin: true, onCompleted }),
      );
      post('https://anything.example.com', frameOf(container), { type: TURBOSIGN_COMPLETED, documentId: 'doc_dev' });
      expect(onCompleted).toHaveBeenCalledWith({ documentId: 'doc_dev' });
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('message source check', () => {
    it('ignores a pinned-origin message that did not come from its own iframe', () => {
      const onCompleted = jest.fn();
      render(createElement(TurboSignForm, { embedUrl: EMBED_URL, origin: EXPECTED_ORIGIN, onCompleted }));
      post(EXPECTED_ORIGIN, window, { type: TURBOSIGN_COMPLETED });
      post(EXPECTED_ORIGIN, null, { type: TURBOSIGN_COMPLETED });
      expect(onCompleted).not.toHaveBeenCalled();
    });

    it('still checks the source under allowAnyOrigin', () => {
      const onCompleted = jest.fn();
      render(createElement(TurboSignForm, { embedUrl: EMBED_URL, allowAnyOrigin: true, onCompleted }));
      post('https://anything.example.com', window, { type: TURBOSIGN_COMPLETED });
      expect(onCompleted).not.toHaveBeenCalled();
    });
  });

  describe('title prop', () => {
    it('defaults the iframe title to "TurboSign signing"', () => {
      const { container } = render(
        createElement(TurboSignForm, { embedUrl: EMBED_URL, origin: EXPECTED_ORIGIN, onCompleted: jest.fn() }),
      );
      expect(container.querySelector('iframe')?.getAttribute('title')).toBe('TurboSign signing');
    });

    it('uses the title prop as the iframe title', () => {
      const { container } = render(
        createElement(TurboSignForm, {
          embedUrl: EMBED_URL,
          origin: EXPECTED_ORIGIN,
          title: 'Sign your lease',
          onCompleted: jest.fn(),
        }),
      );
      expect(container.querySelector('iframe')?.getAttribute('title')).toBe('Sign your lease');
    });
  });
});
