import { html } from "@html";
import { debounceFn } from "@functions/debounce";
import { getValues } from "@html/html";
import { TemplateInstance } from "@html/parts";
import { PropertyMeta, QueryMeta, Setting } from "./types";

const defaultSetting: ShadowRootInit & Partial<Setting> = {
  mode: "open",
}

export class CustomElement extends HTMLElement {

  static observedAttributes = [];

  get root () {
    if (this.templateInstance?.element) return this.templateInstance.element;
    if (this.shadowRoot) return this.shadowRoot;
    return this as HTMLElement;
  }

  constructor(shadowRootInit?: ShadowRootInit & Partial<Setting>) {
    super();
    const settings = {
      ...defaultSetting,
      ...(shadowRootInit ?? {})
    }

    this.attachShadow(settings);
    this.requestUpdate = debounceFn(this.update, settings.requestUpdateTimeout ?? 50);
  }

  connectedCallback() {
    this.update();
  }

  disconnectedCallback() {}

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    if (!this.propertyMeta) return;
    
    const update = this.propertyMeta.get(name);
    if (update) update.call(this, newValue, oldValue);
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
      this.dispatchEvent(new Event("first-render"));
    }
    else 
    {
      if (!newValues) return void console.error("[error] values could not be found")

      this.templateInstance.update(newValues);
    }

    this.findQueries();
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

  // helper variables & private functions 
  private templateInstance: TemplateInstance|null = null;

  // decorator query 
  private queryMeta?: QueryMeta[];
  private findQueries() {
    if (!this.queryMeta) return;
    for (let meta of this.queryMeta)
    {
      if ((this as any)[meta.propertyKey]) continue;
      const elm = this.root.querySelector(meta.selector);
      if (meta.load) meta.load(elm);
      (this as any)[meta.propertyKey] = elm;
    }
  } 

  // decorator property 
  private propertyMeta?: PropertyMeta;
}