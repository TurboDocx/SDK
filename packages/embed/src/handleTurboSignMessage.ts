/**
 * The load-bearing logic of the TurboSign embedded-signing widget: a single, pure, side-effect-free
 * function that decides what a `postMessage` from an embedded TurboSign signing page means.
 *
 * The embedded signing page posts to its parent window, targeting the embedder's origin when it can
 * resolve it and `'*'` otherwise. The host is therefore responsible for ORIGIN PINNING: ignoring any
 * message whose `event.origin` is not the expected TurboSign origin. It FAILS CLOSED: with no origin
 * configured every message is ignored unless the caller explicitly opts out with `allowAnyOrigin`.
 * Callers that own the iframe can also pass `expectedSource` (the iframe's `contentWindow`) so a
 * different window on the same origin cannot forge a message. This function centralizes those checks
 * plus the dispatch on `event.data.type`, so the web component and the React component share one
 * tested code path instead of each hand-rolling `window.addEventListener('message', ...)`.
 */

/** The shape a TurboSign signing page posts to the parent window. */
export interface TurboSignMessageData {
  /** Message discriminator, e.g. `"turbosign:completed"`. */
  type?: unknown;
  /** The signing document's id (present on completion). */
  documentId?: unknown;
  /** Document status, e.g. `"completed"`. */
  status?: unknown;
  /** What happened: `"signing_complete"` or `"already_signed"` (a reopened, already-completed link). */
  event?: unknown;
  /** What completed: `"recipient"` (this signer's step; others may still be pending). */
  scope?: unknown;
}

/** The minimal slice of a `MessageEvent` this handler reads. Keeps it trivially unit-testable. */
export interface TurboSignMessageEvent {
  /** The origin of the window that sent the message. */
  origin: string;
  /** The window that sent the message (`MessageEvent.source`). Only read when `expectedSource` is set. */
  source?: unknown;
  /** The message payload. */
  data: unknown;
}

/** Result passed to {@link TurboSignMessageHandlers.onCompleted}. */
export interface TurboSignCompletedResult {
  /** The signed document's id, when the signing page included it. */
  documentId?: string;
  /** The reported status (currently always `"completed"`). */
  status?: string;
  /**
   * `"signing_complete"` when the signer just finished, or `"already_signed"` when they reopened a
   * link they had already completed (so you can skip "thanks for signing" side effects).
   */
  event?: string;
  /**
   * What completed. Always `"recipient"` today: THIS signer's step. On a multi-signer document others
   * may still be pending, so read the document's own status server-side when you need it.
   */
  scope?: string;
}

/** Callbacks + configuration for {@link handleTurboSignMessage}. */
export interface TurboSignMessageHandlers {
  /**
   * The exact origin the embedded signing page is served from, e.g. `"https://app.turbodocx.com"`.
   *
   * ORIGIN PINNING: any message whose `event.origin` does not match it exactly is ignored.
   *
   * FAILS CLOSED: when it is `null`, `undefined`, or `""`, EVERY message is ignored, unless
   * {@link TurboSignMessageHandlers.allowAnyOrigin} is `true`. Always pin it to your known TurboSign
   * origin.
   */
  expectedOrigin?: string | null;
  /**
   * DEVELOPMENT ONLY. When `true` and no `expectedOrigin` is set, messages from ANY origin are
   * accepted. That fails open: any other frame on the page could post a forged `turbosign:completed`
   * and trigger your completion flow. Never enable it in production. Ignored when `expectedOrigin` is
   * set (a pinned origin always wins). Defaults to `false`.
   */
  allowAnyOrigin?: boolean;
  /**
   * The window the message must come from, normally the signing iframe's `contentWindow`. When
   * provided (including `null`), any message whose `event.source` is not this exact object is ignored,
   * so another window on the same origin cannot forge a message. Leave it `undefined` to skip the
   * check (for example when you do not own the iframe).
   */
  expectedSource?: unknown;
  /** Called when the signer finishes and the page posts `turbosign:completed`. */
  onCompleted?: (result: TurboSignCompletedResult) => void;
  /**
   * Called if the signer declines (`turbosign:declined`). Reserved: the product does not emit this
   * message today, but the hook exists so integrators do not have to change wiring when it does.
   */
  onDeclined?: (result: TurboSignCompletedResult) => void;
  /**
   * Called on an error message (`turbosign:error`). Reserved: not emitted by the product today. The
   * raw message data is forwarded so the integrator can inspect it.
   */
  onError?: (result: TurboSignCompletedResult & { error?: unknown }) => void;
}

/** Message type emitted by a TurboSign signing page on successful completion. */
export const TURBOSIGN_COMPLETED = 'turbosign:completed';
/** Reserved message type for a declined signature (not emitted by the product yet). */
export const TURBOSIGN_DECLINED = 'turbosign:declined';
/** Reserved message type for a signing error (not emitted by the product yet). */
export const TURBOSIGN_ERROR = 'turbosign:error';

/** Narrow an unknown value to a plain object with string keys. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Coerce an unknown field to `string | undefined` without inventing a value. */
function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Interpret one `postMessage` event from an embedded TurboSign signing page and invoke the matching
 * callback. Pure and synchronous: it reads `event.origin` / `event.source` / `event.data` and calls at
 * most one handler.
 *
 * Unrelated messages (wrong or unconfigured origin, wrong source, non-object data, unknown `type`) are
 * ignored silently, so this is safe to call for EVERY window message without pre-filtering.
 *
 * @param event    The `MessageEvent` (or a `{ origin, source, data }` slice of it).
 * @param handlers Origin pin, optional source pin, plus the `onCompleted` / `onDeclined` / `onError`
 *                 callbacks.
 */
export function handleTurboSignMessage(
  event: TurboSignMessageEvent,
  handlers: TurboSignMessageHandlers,
): void {
  const { expectedOrigin, allowAnyOrigin, expectedSource, onCompleted, onDeclined, onError } = handlers;

  // ORIGIN PINNING, failing closed: a configured origin must match exactly; with none configured,
  // drop everything unless the caller explicitly opted out for local development.
  if (expectedOrigin) {
    if (event.origin !== expectedOrigin) {
      return;
    }
  } else if (allowAnyOrigin !== true) {
    return;
  }

  // SOURCE PINNING: when the caller knows which window may speak (its own iframe), drop the rest.
  if (expectedSource !== undefined && event.source !== expectedSource) {
    return;
  }

  const data = event.data;
  if (!isRecord(data)) {
    return;
  }

  const type = data.type;
  if (typeof type !== 'string') {
    return;
  }

  const documentId = asOptionalString((data as TurboSignMessageData).documentId);
  const status = asOptionalString((data as TurboSignMessageData).status);
  const completionEvent = asOptionalString((data as TurboSignMessageData).event);
  const scope = asOptionalString((data as TurboSignMessageData).scope);

  switch (type) {
    case TURBOSIGN_COMPLETED:
      onCompleted?.({ documentId, status, event: completionEvent, scope });
      return;
    case TURBOSIGN_DECLINED:
      onDeclined?.({ documentId, status });
      return;
    case TURBOSIGN_ERROR:
      onError?.({ documentId, status, error: data.error });
      return;
    default:
      // Not a TurboSign message we act on. Ignore silently.
      return;
  }
}
