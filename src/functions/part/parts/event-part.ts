import type { Part } from "@functions/part/types";

/**
 * Handles binding and unbinding of DOM event listeners for a given element and event name.
 * Ensures previous listeners are removed before adding new ones.
 */
export class EventPart implements Part {

  private value: EventListenerOrEventListenerObject|null = null;

  constructor(
    private element:Element,
    private name:string,
  ) {}

  apply( 
    value: EventListenerOrEventListenerObject | null
  ) {
    if (this.value) {
      this.element.removeEventListener(this.name as keyof ElementEventMap, this.value);
    }

    if (value) {
      this.element.addEventListener(this.name as keyof ElementEventMap, value);
    }

    this.value = value;
  }

  clear() {
    if (this.value) this.element.removeEventListener(this.name as keyof ElementEventMap, this.value);
  }

  remove() {
    this.clear();
  }
}