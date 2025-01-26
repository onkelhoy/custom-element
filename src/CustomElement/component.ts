import { html, PapElement, papHTML } from "../html";

export class CustomElement extends HTMLElement {

  static observedAttributes = [];

  private _papDom: PapElement;
  private _observer!: MutationObserver;

  // getters 
  get papDOM() {
    return this._papDom;
  }
  get root () {
    if (this.shadowRoot) return this.shadowRoot;
    return this as HTMLElement;
  }

  constructor(shadowRootInit: ShadowRootInit) {
    super();

    this.attachShadow(shadowRootInit);
    this._papDom = {
      attributes: {},
      children: [],
      events: {},
      tagName: this.tagName,
      text: null
    };
  }

  connectedCallback() {
    this.update();

    this._observer = this._setupMutationObserver();
  }

  disconnectedCallback() {
    this._observer.disconnect();
  }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    console.log('attribute has changed', name, oldValue, newValue);
  }

  update() {
    let info = this.render();
    if (typeof info === "string") info = html`${info}`;

    this._papDom = info.papDOM;

    this.root.innerHTML = "";
    Array.from(info.dom.body.childNodes).forEach((child) => {
      this.root.appendChild(child);
    });
  }

  querySelector<T extends Element>(selectors: string) {
    return this.root.querySelector<T>(selectors);
  }
  querySelectorAll<T extends Element>(selectors: string) {
    return this.root.querySelectorAll<T>(selectors);
  }

  render():string|papHTML {
    return `
      <div>hello</div>
    `
  }


  // mutation observer 
  private _setupMutationObserver () {
    const observer = new MutationObserver((mutationList) => {
      for (let mutation of mutationList)
      {
        this._handleMutation(mutation);
      } 
    });

    observer.observe(this.root, {
      attributes: true,
      subtree: true,
      childList: true,
      characterData: true,
    });

    return observer;
  }
  private _handleMutation(mutation: MutationRecord) {
    console.log('DOM CHANGE', mutation);
  }
}
