/**
 * `@turbodocx/embed` is the framework-agnostic entry point for the TurboSign embedded-signing widget.
 *
 * Exports the pure {@link handleTurboSignMessage} logic and the `<turbosign-form>` web component. It
 * deliberately does NOT import React, so the emitted `dist/index.js` is a self-contained browser ES
 * module (no bare imports) loadable via `<script type="module">`. The React component lives behind the
 * `@turbodocx/embed/react` subpath so that `react` is only ever pulled in by React consumers.
 */
export * from './handleTurboSignMessage.js';
export * from './TurboSignFormElement.js';
