/**
 * The load-bearing logic of the TurboSign embedded-signing widget: a single, pure, side-effect-free
 * function that decides what a `postMessage` from an embedded TurboSign signing page means.
 *
 * The embedded signing page posts to its parent window with `targetOrigin: '*'` (it does not know the
 * host's origin). The host is therefore responsible for ORIGIN PINNING: ignoring any message whose
 * `event.origin` is not the expected TurboSign origin. This function centralizes that check plus the
 * dispatch on `event.data.type`, so the web component and the React component share one tested code
 * path instead of each hand-rolling `window.addEventListener('message', ...)`.
 */

/** The shape a TurboSign signing page posts to the parent window. */
export interface TurboSignMessageData {
  /** Message discriminator, e.g. `"turbosign:completed"`. */
  type?: unknown;
  /** The signing document's id (present on completion). */
  documentId?: unknown;
  /** Document status, e.g. `"completed"`. */
  status?: unknown;
}

/** The minimal slice of a `MessageEvent` this handler reads. Keeps it trivially unit-testable. */
export interface TurboSignMessageEvent {
  /** The origin of the window that sent the message. */
  origin: string;
  /** The message payload. */
  data: unknown;
}

/** Result passed to {@link TurboSignMessageHandlers.onCompleted}. */
export interface TurboSignCompletedResult {
  /** The signed document's id, when the signing page included it. */
  documentId?: string;
  /** The reported status (currently always `"completed"`). */
  status?: string;
}

/** Callbacks + configuration for {@link handleTurboSignMessage}. */
export interface TurboSignMessageHandlers {
  /**
   * The exact origin the embedded signing page is served from, e.g. `"https://app.turbodocx.com"`.
   *
   * ORIGIN PINNING: when this is a non-empty string, any message whose `event.origin` does not match
   * it exactly is ignored. When it is `null`, `undefined`, or `""`, the origin check is skipped and
   * messages from ANY origin are accepted.
   *
   * Skipping the check FAILS OPEN: a malicious framed page (or any other frame on the host) could then
   * post a forged `turbosign:completed` and trigger your completion flow. Leave it unset only for local
   * development; in production always pin it to your known TurboSign origin. Note that
   * `<turbosign-form origin="">` (an empty attribute) also fails open by this rule.
   */
  expectedOrigin?: string | null;
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
 * callback. Pure and synchronous: it reads `event.origin` / `event.data` and calls at most one handler.
 *
 * Unrelated messages (wrong origin, non-object data, unknown `type`) are ignored silently, so this is
 * safe to call for EVERY window message without pre-filtering.
 *
 * @param event    The `MessageEvent` (or a `{ origin, data }` slice of it).
 * @param handlers Origin pin plus the `onCompleted` / `onDeclined` / `onError` callbacks.
 */
export function handleTurboSignMessage(
  event: TurboSignMessageEvent,
  handlers: TurboSignMessageHandlers,
): void {
  const { expectedOrigin, onCompleted, onDeclined, onError } = handlers;

  // ORIGIN PINNING: when an origin is configured (non-empty), drop anything not from it.
  if (expectedOrigin && event.origin !== expectedOrigin) {
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

  switch (type) {
    case TURBOSIGN_COMPLETED:
      onCompleted?.({ documentId, status });
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
