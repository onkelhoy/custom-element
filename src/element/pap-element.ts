import { html } from "@html";
import { Setting } from "./types";
import { debounceFn } from "@functions/debounce";
import { getValues } from "@html/html";
import { TemplateInstance } from "@html/parts";

export class PapElement extends HTMLElement {

  static observedAttributes = [];

  private templateInstance: TemplateInstance|null = null;

  get root () {
    if (this.templateInstance?.element) return this.templateInstance.element;
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

    const newValues = getValues(newRoot);

    if (this.templateInstance == null)
    {
      this.root.append(newRoot);
      this.templateInstance = new TemplateInstance(newRoot);
      this.firstRender();
    }
    else 
    {
      if (!newValues) return void console.error("[error] values could not be found")

      this.templateInstance.update(newValues);
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
