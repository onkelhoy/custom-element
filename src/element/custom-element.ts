/**
 * @fileoverview Defines the `CustomElement` base class for building
 * declarative, reactive custom elements with efficient template rendering.
 *
 * @details
 * **Core Features:**
 * - **Declarative Rendering** — Uses a `render()` method that can return either a string or an `Element`.
 * - **Template Diffing** — Backed by `TemplateInstance` for efficient updates without replacing the whole DOM.
 * - **Debounced Updates** — Integrates `requestUpdate()` with configurable debounce delay.
 * - **Reactive Attributes** — Supports observed attributes and property decorators for sync between DOM and JS.
 * - **Query Decorators** — Automatically resolves `@query`-decorated fields after each render.
 * - **Lifecycle Hooks**:
 *   - `firstRender()` — Called once after the initial render.
 *   - `connectedCallback()` / `disconnectedCallback()` — Standard custom element lifecycle.
 *
 * **Render Flow:**
 * 1. `connectedCallback()` triggers the first `update()`.
 * 2. `update()` renders the template and updates only changed parts.
 * 3. Decorator queries are resolved after each render.
 *
 * @example
 * ```ts
 * class MyElement extends CustomElement {
 *   render() {
 *     return html`<div>Hello ${this.name}</div>`;
 *   }
 * }
 * customElements.define('my-element', MyElement);
 * ```
 *
 * @see {@link TemplateInstance} — Handles part-based DOM updates.
 * @see {@link html} — Tagged template function for building DOM trees.
 *
 * @created 2025-08-11
 * @author
 * Henry Pap (GitHub: @onkelhoy)
 */

import { html, getValues } from "@html";
import { debounceFn } from "@functions/debounce";
import { TemplateInstance, partFactory } from '@functions/part';
import { PropertyMeta, QueryMeta, Setting } from "./types";

const defaultSetting: ShadowRootInit & Partial<Setting> = {
  mode: "open",
}

/**
 * Base class for custom elements with declarative template rendering.
 * Uses a `TemplateInstance` for efficient updates without re-rendering the entire DOM.
 * Supports reactive attributes, property decorators, and query decorators.
 */
export class CustomElement extends HTMLElement {

  /**
   * List of attributes to observe for changes.
   * Should be populated by decorators or subclasses.
   */
  static observedAttributes = [];

  /**
   * Returns the root node into which content is rendered:
   * - If `templateInstance` exists, returns its root element
   * - Else, if the element has a shadow root, returns it
   * - Else, returns the element itself
   */
  get root () {
    if (this.templateInstance?.element) return this.templateInstance.element;
    if (this.shadowRoot) return this.shadowRoot;
    return this as HTMLElement;
  }

  /**
   * Creates a new custom element.
   * @param shadowRootInit Options for `attachShadow`, merged with defaults.
   *                       Can also include custom settings such as `requestUpdateTimeout`.
   */
  constructor(shadowRootInit?: ShadowRootInit & Partial<Setting>) {
    super();
    const settings = {
      ...defaultSetting,
      ...(shadowRootInit ?? {})
    }

    this.attachShadow(settings);
    this.requestUpdate = debounceFn(this.update, settings.requestUpdateTimeout ?? 50);
  }

  /**
   * Lifecycle: called when element is added to the DOM.
   * Triggers the first update/render.
   */
  connectedCallback() {
    this.update();
  }

  /**
   * Lifecycle: called when element is removed from the DOM.
   * Empty by default, but subclasses can override.
   */
  disconnectedCallback() {}

  /**
   * Lifecycle: called when an observed attribute changes.
   * Forwards changes to any registered property update handlers.
   * @param name The attribute name
   * @param oldValue Previous attribute value
   * @param newValue New attribute value
   */
  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    if (!this.propertyMeta) return;
    
    const update = this.propertyMeta.get(name);
    if (update) update.call(this, newValue, oldValue);
  }

  /**
   * Hook called after the first render completes.
   * Subclasses can override for setup logic.
   */
  firstRender() {}

  /**
   * Renders (or updates) the template into the root.
   * - On first run, appends the new template and calls `firstRender`.
   * - On subsequent runs, updates the existing `TemplateInstance` with new values.
   * - Also resolves any `@query`-decorated properties.
   */
  update() {
    let newRoot = this.render();
    if (typeof newRoot === "string") newRoot = html`${newRoot}`;

    if (!newRoot) throw new Error("[error] core: no element returned from render");

    const newValues = getValues(newRoot);

    if (this.templateInstance == null)
    {
      this.root.append(newRoot);
      this.templateInstance = new TemplateInstance(newRoot, partFactory);
      this.firstRender();
      this.dispatchEvent(new Event("first-render"));
    }

    if (!newValues) return void console.error("[error] values could not be found")

    this.templateInstance.update(newValues);

    this.findQueries();
  }

  /**
   * Requests an update to the DOM.
   * The update is debounced according to `requestUpdateTimeout`.
   */
  requestUpdate() {}

  /**
   * Queries for the first matching element within this element's render root.
   * @param selectors A valid CSS selector string
   */
  querySelector<T extends Element>(selectors: string) {
    return this.root.querySelector<T>(selectors);
  }
  /**
   * Queries for all matching elements within this element's render root.
   * @param selectors A valid CSS selector string
   */
  querySelectorAll<T extends Element>(selectors: string) {
    return this.root.querySelectorAll<T>(selectors);
  }

  /**
   * Returns the template to render.
   * Can return either:
   * - A string (will be converted to a template)
   * - An Element (template root)
   */
  render():string|Element {
    return "Phuong is so kool"
  }

  // helper variables & private functions 
  private templateInstance: TemplateInstance|null = null;

  // decorator query 
  private queryMeta?: QueryMeta[];

  /**
   * Resolves `@query`-decorated properties by querying the render root.
   * If a `load` callback exists, it is invoked with the found element.
   */
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