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

  afterEach(() => cleanup());

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
    render(
      createElement(TurboSignForm, { embedUrl: EMBED_URL, origin: EXPECTED_ORIGIN, onCompleted }),
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: EXPECTED_ORIGIN,
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
    const { unmount } = render(
      createElement(TurboSignForm, { embedUrl: EMBED_URL, origin: EXPECTED_ORIGIN, onCompleted }),
    );
    unmount();

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: EXPECTED_ORIGIN,
        data: { type: TURBOSIGN_COMPLETED, documentId: 'doc_react' },
      }),
    );

    expect(onCompleted).not.toHaveBeenCalled();
  });
});
