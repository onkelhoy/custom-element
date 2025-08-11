import type { Part } from "@functions/part/types";

/**
 * A dynamic attribute binding for an element.
 * Updates or clears a single attribute based on value changes.
 * Special-cases `key` so it's stored on the element synchronously
 * for list diffing without relying on browser frame updates.
 */
export class AttributePart implements Part {

  private value:string|null = null;

  constructor(
    private element:Element,
    private name:string,
  ) {}
  
  apply(value: string|null) {
    if (value === this.value) return;
    this.value = value;

    if (!value && value !== "") return void this.clear();

    // key is special for managing lists and we cannot rely on attribute as it assigns only on next browser frame-update 
    if (this.name === "key") { 
      (this.element as any).__manualKey = value;
    }
    this.element.setAttribute(this.name, value);
  }

  clear() {
    this.element.removeAttribute(this.name);
  }

  remove() {
    this.clear();
  }
}