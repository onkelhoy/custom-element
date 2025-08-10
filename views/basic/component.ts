import { CustomElement, html, bind, property, query } from "@papit/core";

const arr = ["henry", "simon", "layhe", "julian", "rick", "bubbles"];
export class Basic extends CustomElement {

  @property({
    type: Boolean,
    rerender: true,

  })
  private show = false;


  @property({
    type: Number,
    rerender: true,
    attribute: "counter",
  })
  private count = 0;


  @property({
    rerender: true,
  })
  private name = "henry";

  @query<HTMLSpanElement>({
    load(this: Basic, elm) {
      // console.log('hej:', elm, this)
    },
    selector: "span"
  }) hej!: HTMLSpanElement;


  @query<HTMLSpanElement>({
    load(this: Basic, elm) {
      // console.log('ul is found:', elm, this)
    },
    selector: "ul"
  }) hejsan!: HTMLSpanElement;

  @bind
  private handleshow () {
    this.show = true;
  }

  @bind
  private handlehide() {
    this.show = false;
  }

  @bind
  private handleinc () {
    this.count++;

    this.name = arr[this.count % arr.length];
    // console.log(this.hej);
  }

  @bind
  private handledec() {
    this.count--;

    this.name = arr[this.count % arr.length];

  }

  render() {

    // const a = html`<a href="#bajs">im anchor</a>`
      // ${a}

    return html`
      <span>WOW</span>
      <h3>show: ${this.show}</h3>
      <button onclick=${this.handleshow}>show</button>
      <button onclick=${this.handlehide}>hide</button>

      <h3>count: ${this.count}</h3>
      <button onclick=${this.handleinc}>inc</button>
      <button onclick=${this.handledec}>dec</button>

      ${this.show ? html`
        <h1>IM ${this.count}</h1>
        <ul>
          <li>Array with keys</li>
          ${new Array(Math.max(this.count, 0)).fill(0).map((_, i) => html`<li key=${i}>item: ${i} ${i === 5 ? html`<strong>FIVE ${this.name}</strong>` : null}</li>`)}
        </ul>

        <ul>
          <li>Array without keys</li>
          ${new Array(Math.max(this.count, 0)).fill(0).map((_, i) => html`<li>item: ${i} ${i === 5 ? html`<strong>FIVE ${this.name}</strong>` : null}</li>`)}
        </ul>
      ` : null}
    `;
  }
}

// Register the element with the browser
const cElements = customElements ?? window?.customElements;

if (!cElements) {
  throw new Error('Custom Elements not supported');
}

if (!cElements.get('pap-core-basic')) {
  cElements.define('pap-core-basic', Basic);
}