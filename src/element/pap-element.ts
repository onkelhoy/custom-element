import { html, type NodeInfo, type papHTML, } from "@html";
import { Setting } from "./types";
import { debounceFn } from "@functions/debounce";
import { differ } from "@html/differ";

export class PapElement extends HTMLElement {

  static observedAttributes = [];

  private _papDom!: NodeInfo;
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
    this.__internalUpdateCall = true;
    let info = this.render();
    if (typeof info === "string") info = html`${info}`;

    if (!Object.hasOwn(this, "_papDom"))
    {
      this._papDom = {
        attributes: {},
        children: info.papDOM,
        events: {},
        tagName: this.tagName,
        text: null
      };
      
      this.root.innerHTML = "";
      this.root.append(info.dom);
      return;
    }
    
    differ(this.papDOM, info);
    this.__internalUpdateCall = false; // just now as we dont apply any changed 
    // // now we can process html (injecting events etc)
    // // info.

    

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
      <div>hello World</div>
    `
  }

  // mutation observer 
  // WHEN DIFFING WE CAN ONLY LOOK FOR THE VALUES IN THE TEMPLATE LITERAL and then we 
  // can update only those, so the html should have a init case or something where we can keep track of those 
  private _setupMutationObserver () {
    const observer = new MutationObserver((mutationList) => {
      if (this.__internalUpdateCall) return;

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
    console.log('DOM CHANGE', mutation);
  }
}
