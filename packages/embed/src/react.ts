/**
 * `@turbodocx/embed/react` is the React entry point. Kept separate from the package root so the
 * framework-agnostic build (`@turbodocx/embed`) never imports `react`. React is a peer dependency.
 */
export { TurboSignForm, type TurboSignFormProps } from './TurboSignForm.js';
export {
  handleTurboSignMessage,
  type TurboSignCompletedResult,
  type TurboSignMessageHandlers,
  type TurboSignMessageEvent,
  type TurboSignMessageData,
} from './handleTurboSignMessage.js';
