import { PapElement } from "@element";
import { html } from "@html";
import { bind } from "@decorators/bind";
import { property } from "./decorators/property";
import { debounce } from "@decorators/debounce";

export class NewCore extends PapElement {

  // @property({ default: "hello" })
  @property({
    type: Number,
    rerender: true,
  })
  count = 0;

  constructor() {
    super({ mode: 'open' });
  }

  @bind
  private handleinc () {
    this.count++;
  }

  @bind
  private handledec() {
    this.count--;
  }

  @bind
  private renderArray() {
    const arr = new Array(this.count).fill(0).map((_, index) => html`<li>${index}</li>`);
    console.log('render array', arr);
    return arr;
  }

  render() {
    // console.log('render called', this.hello)
    // const a = RenderAlt('bajs')`<p hello=${this.hello}>hello</p>`;
    // console.log('A', a)

    const elm = html`
      <button onclick=${this.handleinc}>inc</button>
      <button onclick=${this.handledec}>dec</button>

      ${this.count < 5 ? html`<p>bajs ${this.count}</p>` : null}
      <p>count: ${this.count}</p>

        <ul>
          <li>fkrst</li>
          ${this.renderArray()}
        </ul>
    `;

    return elm;
  }
}