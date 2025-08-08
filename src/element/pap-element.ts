import { html } from "@html";
import { Meta, Setting } from "./types";
import { debounceFn } from "@functions/debounce";
import { getValues } from "@html/html";
import { getParts } from "@html/parts";
// import { getMetadata } from "@html/html";

export class PapElement extends HTMLElement {

  static observedAttributes = [];

  private meta: Meta|null = null;

  get root () {
    if (this.meta?.element) return this.meta.element;
    if (this.shadowRoot) return this.shadowRoot;
    return this as HTMLElement;
  }

  constructor(shadowRootInit: ShadowRootInit & Partial<Setting>) {
    super();

    this.attachShadow(shadowRootInit);
    this.requestUpdate = debounceFn(this.update, shadowRootInit.requestUpdateTimeout ?? 50);
  }

  connectedCallback() {
    this.update();
  }

  disconnectedCallback() {}

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    console.log('attribute has changed', name, oldValue, newValue);
  }

  firstRender() {}

  update() {
    let newRoot = this.render();
    if (typeof newRoot === "string") newRoot = html`${newRoot}`;

    if (!newRoot) throw new Error("[error] core: no element returned from render");

    // const meta = getMetadata(newRoot);
    // if (!meta) throw new Error("[html] metadata could not be found");

    const newValues = getValues(newRoot);

    if (this.meta == null)
    {
      this.root.append(newRoot);
      this.meta = {
        element: newRoot,
        parts: getParts(newRoot),
        values: [], // important so inital values can be assigned 
      }

      this.firstRender();
      // meta.update(meta.lastValues, true);
    }
    
    if (!newValues) return void console.error("[error] values could not be found")

    for (let i=0; i<newValues?.length; i++)
    {
      const newValue = newValues[i];
      const oldValue = this.meta.values[i];

      console.log('newvalue', newValue)

      if (newValue !== oldValue)
      {
        this.meta.values[i] = newValue;
        this.meta.parts[i].apply(newValue, oldValue);
      }
    }
  }

  requestUpdate() {}

  querySelector<T extends Element>(selectors: string) {
    return this.root.querySelector<T>(selectors);
  }
  querySelectorAll<T extends Element>(selectors: string) {
    return this.root.querySelectorAll<T>(selectors);
  }

  render():string|Element {
    return `
      <div>hello World</div>
    `
  }
}
