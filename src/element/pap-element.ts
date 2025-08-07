import { html, type NodeInfo, type papHTML, } from "@html";
import { Setting } from "./types";
import { debounceFn } from "@functions/debounce";

export class PapElement extends HTMLElement {

  static observedAttributes = [];

  private _papDom: NodeInfo;
  private _observer!: MutationObserver;
  private __internalUpdateCall = false;

  // getters 
  get papDOM() {
    return this._papDom;
  }
  get root () {
    if (this.shadowRoot) return this.shadowRoot;
    return this as HTMLElement;
  }

  constructor(shadowRootInit: ShadowRootInit & Partial<Setting>) {
    super();

    this.attachShadow(shadowRootInit);

    this._papDom = {
      attributes: {},
      children: [],
      events: {},
      tagName: this.tagName,
      text: null
    };
    this.requestUpdate = debounceFn(this.update, shadowRootInit.requestUpdateTimeout ?? 50);
  }

  connectedCallback() {
    this._observer = this._setupMutationObserver();
    
    this.update();
  }

  disconnectedCallback() {
    this._observer.disconnect();
  }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    console.log('attribute has changed', name, oldValue, newValue);
  }

  update() {
    console.log('RENDER')
    this.__internalUpdateCall = true;
    let info = this.render();
    if (typeof info === "string") info = html`${info}`;


    // // now we can process html (injecting events etc)
    // // info.

    this._papDom.children = info.papDOM;

    this.root.innerHTML = "";
    this.root.append(info.dom);
    // Array.from(info.dom.body.childNodes).forEach((child) => {
    //   this.root.appendChild(child);
    // });
  }

  requestUpdate() {}

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

      this.__internalUpdateCall = false;
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
    if (this.__internalUpdateCall) return;
    console.log('DOM CHANGE', mutation);
  }
}
