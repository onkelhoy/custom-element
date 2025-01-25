import { CustomElement } from "./CustomElement";
import { html } from "./html";

export class NewCore extends CustomElement {
  constructor() {
    super({ mode: 'open' });
  }

  render() {
    return html`
      <p>hello</p>
      <div>
        <h1>EMTUUU</h1>
      </div>
    `
  }
}