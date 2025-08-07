import { PapElement } from "@element";
import { html } from "@html";
import { bind } from "@decorators/bind";
import { property } from "./decorators/property";
import { debounce } from "@decorators/debounce";
// import { RenderAlt } from "@html/render";

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
    console.log('im clicked', this.hello);
  }

  @bind
  private handlesubmit() {
    console.log('im submitted');
  }

  render() {
    // console.log('render called', this.hello)
    // const a = RenderAlt('bajs')`<p hello=${this.hello}>hello</p>`;
    // console.log('A', a)

    const elm = html`
      ${this.hello}
      <button @submit=${this.handlesubmit} onclick=${this.handleclick}>add</button>
      <ul>
        <button @reset=${this.handlesubmit} @click=${this.handleclick}>add 2</button>
          UUUUU WOWO 
      </ul>
      <p>hello</p>
      <div>
        <h1 hello=${this.hello}>EMTUUU</h1>
      </div>
    `;

    console.log('elm', elm);
    return elm;
  }
}