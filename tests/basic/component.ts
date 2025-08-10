import { CustomElement, html, bind, property } from "@papit/core";

export class Basic extends CustomElement {

  @property
  private show = false;


  @property({
    type: Number,
    rerender: true,
  })
  count = 0;

  constructor() {
    super({ mode: 'open' });
  }

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
  }

  @bind
  private handledec() {
    this.count--;
  }

  render() {

    return html`
      <h3>show: ${this.show}</h3>
      <button onclick=${this.handleshow}>show</button>
      <button onclick=${this.handlehide}>hide</button>

      <h3>count: ${this.count}</h3>
      <button onclick=${this.handleinc}>inc</button>
      <button onclick=${this.handledec}>dec</button>

      ${this.show ? html`<h1>IM ${this.count}</h1>` : null}      
    `;
  }
}