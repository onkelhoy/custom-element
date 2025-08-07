import { PapElement } from "@element";
import { html } from "@html";
import { bind } from "@decorators/bind";
import { property } from "./decorators/property";
import { debounce } from "@decorators/debounce";

export class NewCore extends PapElement {


  // @property({ default: "hello" })
  @property({
    after: console.log,
    rerender: true,
    get: (value) => {
      return value + "HAAH"
    }
  })
  hello = "bajs";

  constructor() {
    super({ mode: 'open' });
  }

  @bind
  @debounce
  private handleclick () {
    this.hello = "najjaj"
    console.log('im clicked', this.hello, this.papDOM);
  }

  @bind
  private handlesubmit() {
    console.log('im submitted', this.papDOM);
  }

  render() {
    return html`
      HEJSAN
      <button @submit=${this.handlesubmit} onclick=${this.handleclick}>add</button>
      <ul>
        <button @reset=${this.handlesubmit} @click=${this.handleclick}>add 2</button>
          UUUUU WOWO 
      </ul>
      <p>hello</p>
      <div>
        <h1>EMTUUU</h1>
      </div>
    `
  }
}