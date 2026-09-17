/**
 * `<TurboSignForm>` is the React wrapper around TurboSign embedded signing. It renders the iframe and
 * wires the `window` `message` listener through the shared, tested {@link handleTurboSignMessage} in a
 * `useEffect` with cleanup (React 18+ compatible: the effect re-subscribes if inputs change and always
 * removes the listener on unmount).
 *
 * React is a PEER dependency and is imported only from this subpath (`@turbodocx/embed/react`), never
 * from the package root, so the framework-agnostic web component build stays free of any `react` import.
 */
import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactElement } from 'react';

import {
  handleTurboSignMessage,
  type TurboSignCompletedResult,
} from './handleTurboSignMessage.js';

/** Props for {@link TurboSignForm}. */
export interface TurboSignFormProps {
  /** The per-recipient embed URL returned by `TurboSign.createEmbeddedSignature`. */
  embedUrl: string;
  /**
   * The exact origin the signing page is served from (e.g. `"https://app.turbodocx.com"`). Enables
   * ORIGIN PINNING. Omit only in local development; leaving it unset accepts messages from any origin.
   */
  origin?: string | null;
  /** Called when the signer finishes (the page posts `turbosign:completed`). */
  onCompleted: (result: TurboSignCompletedResult) => void;
  /** Called if the signer declines. Reserved: not emitted by the product yet. */
  onDeclined?: (result: TurboSignCompletedResult) => void;
  /** Called on a signing error. Reserved: not emitted by the product yet. */
  onError?: (result: TurboSignCompletedResult & { error?: unknown }) => void;
  /** Iframe height as a CSS length. Defaults to `"720px"`. */
  height?: string | number;
  /** Optional class name for the iframe. */
  className?: string;
  /** Optional inline styles merged onto the iframe (after width/height/border defaults). */
  style?: CSSProperties;
}

/** Coerce a height prop (`720`, `"720"`, or `"80vh"`) to a CSS length. */
function toCssHeight(height: string | number | undefined): string {
  if (height === undefined) {
    return '720px';
  }
  return typeof height === 'number' ? `${height}px` : /^\d+$/.test(height) ? `${height}px` : height;
}

/**
 * React component that embeds a TurboSign signing page and surfaces its completion callback.
 *
 * @example
 * ```tsx
 * <TurboSignForm
 *   embedUrl={embedUrl}
 *   origin="https://app.turbodocx.com"
 *   onCompleted={({ documentId }) => setDone(documentId)}
 * />
 * ```
 */
export function TurboSignForm({
  embedUrl,
  origin,
  onCompleted,
  onDeclined,
  onError,
  height,
  className,
  style,
}: TurboSignFormProps): ReactElement {
  // Keep the latest callbacks in a ref so the effect does not need to re-subscribe on every render.
  const handlersRef = useRef({ onCompleted, onDeclined, onError });
  handlersRef.current = { onCompleted, onDeclined, onError };

  useEffect(() => {
    const listener = (event: MessageEvent): void => {
      handleTurboSignMessage(
        { origin: event.origin, data: event.data },
        {
          expectedOrigin: origin,
          onCompleted: (result) => handlersRef.current.onCompleted(result),
          onDeclined: (result) => handlersRef.current.onDeclined?.(result),
          onError: (result) => handlersRef.current.onError?.(result),
        },
      );
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [origin]);

  return (
    <iframe
      src={embedUrl}
      title="TurboSign signing"
      allow="clipboard-write"
      className={className}
      style={{ width: '100%', height: toCssHeight(height), border: 0, display: 'block', ...style }}
    />
  );
}
