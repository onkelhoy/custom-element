import { NewCore } from './component.js';

// export 
export * from "./component.js";
export * from "./types";

// Register the element with the browser

if (!window.customElements) {
  throw new Error('Custom Elements not supported');
}

if (!window.customElements.get('new-core')) {
  window.customElements.define('new-core', NewCore);
}
