import { html } from "@html";
import { Setting } from "./types";
import { debounceFn } from "@functions/debounce";
import { getValues } from "@html/html";
import { getParts, TemplateInstance } from "@html/parts";
// import { getMetadata } from "@html/html";

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

    // const meta = getMetadata(newRoot);
    // if (!meta) throw new Error("[html] metadata could not be found");

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

    // if (!this.meta) {
    //   const el = newRoot.template.cloneNode(true) as Element;
    //   this.meta = new TemplateInstance(el, newRoot.values);
    //   this.root.append(el);
    // } else {
    //   this.meta.update(newRoot.values);
    // }
    
    // if (!newValues) return void console.error("[error] values could not be found")
    
    // const max = Math.max(this.meta.values.length, newValues.length); // should only take newValues.length ? 
    // for (let i=0; i<max; i++)
    // {
    //   const newValue = newValues[i];
    //   if (newValue === undefined)
    //   {
    //     console.warn("[warning] core: new-value is undefined, should get looked into", this.meta, newValues); 
    //   }

    //   const oldValue = this.meta.values[i];

    //   if (!this.meta.parts[i].compare(newValue, oldValue))
    //   {
    //     this.meta.values[i] = newValue;
    //     this.meta.parts[i].apply(newValue, oldValue);
    //   }
    // }
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
