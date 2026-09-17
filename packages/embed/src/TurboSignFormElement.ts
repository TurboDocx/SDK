/**
 * `<turbosign-form>` is a framework-agnostic custom element that embeds a TurboSign signing page.
 *
 * It renders the iframe, attaches the `window` `message` listener (delegating to the shared, tested
 * {@link handleTurboSignMessage} for origin pinning + dispatch), re-emits the result as bubbling DOM
 * `CustomEvent`s, and tears the listener down on disconnect. No build step is needed to USE it: import
 * the built ES module with a `<script type="module">` and drop the tag in your HTML.
 *
 * @example
 * ```html
 * <script type="module" src="/embed/index.js"></script>
 * <turbosign-form embed-url="https://app.turbodocx.com/sign/..." origin="https://app.turbodocx.com"></turbosign-form>
 * <script>
 *   document.querySelector('turbosign-form')
 *     .addEventListener('turbosign:completed', (e) => console.log('signed', e.detail.documentId));
 * </script>
 * ```
 */
import {
  handleTurboSignMessage,
  TURBOSIGN_COMPLETED,
  TURBOSIGN_DECLINED,
  TURBOSIGN_ERROR,
  type TurboSignCompletedResult,
} from './handleTurboSignMessage.js';

/** The tag name the element registers under by default. */
export const TURBOSIGN_FORM_TAG = 'turbosign-form';

/** Default iframe height when the `height` attribute is not set. */
const DEFAULT_HEIGHT = '720px';

/** Normalize a height attribute value (`"720"` or `"720px"` or `"80vh"`) to a CSS length. */
function toCssLength(value: string | null): string {
  if (!value) {
    return DEFAULT_HEIGHT;
  }
  return /^\d+$/.test(value) ? `${value}px` : value;
}

/**
 * The `<turbosign-form>` custom element. Register it with {@link defineTurboSignForm} (called
 * automatically when this module is imported in a browser).
 */
export class TurboSignFormElement extends HTMLElement {
  /** Attributes that trigger {@link attributeChangedCallback} when changed. */
  static get observedAttributes(): string[] {
    return ['embed-url', 'origin', 'height'];
  }

  /** The rendered iframe, created once on connect. */
  private iframe: HTMLIFrameElement | null = null;

  /** The bound `message` listener, retained so it can be removed on disconnect. */
  private readonly onMessage = (event: MessageEvent): void => {
    handleTurboSignMessage(
      { origin: event.origin, data: event.data },
      {
        expectedOrigin: this.getAttribute('origin'),
        onCompleted: (result) => this.emit(TURBOSIGN_COMPLETED, result),
        onDeclined: (result) => this.emit(TURBOSIGN_DECLINED, result),
        onError: (result) => this.emit(TURBOSIGN_ERROR, result),
      },
    );
  };

  /** Build the iframe (once) and start listening for the signing page's postMessage. */
  connectedCallback(): void {
    if (!this.iframe) {
      const iframe = document.createElement('iframe');
      iframe.title = 'TurboSign signing';
      iframe.setAttribute('allow', 'clipboard-write');
      iframe.style.width = '100%';
      iframe.style.border = '0';
      iframe.style.display = 'block';
      this.iframe = iframe;
      this.appendChild(iframe);
    }
    this.syncIframe();
    window.addEventListener('message', this.onMessage);
  }

  /** Stop listening so a removed element does not leak a global listener. */
  disconnectedCallback(): void {
    window.removeEventListener('message', this.onMessage);
  }

  /** Reflect attribute changes (src / height) onto the iframe. Origin changes need no DOM update. */
  attributeChangedCallback(): void {
    if (this.iframe) {
      this.syncIframe();
    }
  }

  /** Push the current `embed-url` / `height` attributes onto the iframe element. */
  private syncIframe(): void {
    if (!this.iframe) {
      return;
    }
    const src = this.getAttribute('embed-url') ?? '';
    if (this.iframe.getAttribute('src') !== src) {
      this.iframe.setAttribute('src', src);
    }
    this.iframe.style.height = toCssLength(this.getAttribute('height'));
  }

  /** Dispatch a bubbling, composed CustomEvent carrying the parsed result. */
  private emit(type: string, detail: TurboSignCompletedResult & { error?: unknown }): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
}

/**
 * Register {@link TurboSignFormElement} as a custom element. Safe to call more than once; it no-ops if
 * the tag is already defined.
 *
 * @param tagName Custom-element tag name to register under. Defaults to `"turbosign-form"`.
 */
export function defineTurboSignForm(tagName: string = TURBOSIGN_FORM_TAG): void {
  if (typeof customElements === 'undefined') {
    return;
  }
  if (!customElements.get(tagName)) {
    customElements.define(tagName, TurboSignFormElement);
  }
}

// Auto-register on import in a browser so a plain `<script type="module" src=".../index.js">` is
// enough to start using <turbosign-form> with no extra call. No-ops in Node / SSR.
defineTurboSignForm();
