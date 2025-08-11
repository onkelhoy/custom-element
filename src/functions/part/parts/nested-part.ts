import type { Part, PartHelpers, ITemplateInstance } from "@functions/part/types";
import { getValues } from "@html/html";

/**
 * Manages a nested template instance inserted at a marker position.
 * Creates, updates, and removes the child template efficiently
 * without re-rendering its parent.
 */
export class NestedPart implements Part {
  private instance: ITemplateInstance | null = null;

  constructor(
    private marker: Comment,
    private helpers: PartHelpers
  ) {}

  apply(newValue: any) {
    if (!(newValue instanceof Element) || !(newValue as any).__isTemplateRoot) {
      this.clear();
      return;
    }

    const values = getValues(newValue);

    if (!this.instance) {
      this.instance = this.helpers.createTemplateInstance(newValue);

      // Insert into DOM before the marker
      this.marker.parentNode!.insertBefore(newValue, this.marker);

      if (values) {
        this.instance.update(values);
      }
    } else if (values) {
      this.instance.update(values);
    }
  }

  clear() {
    if (this.instance) {
      this.instance.remove();
      this.instance = null;
    }
  }
  
  remove() {
    this.clear();
    this.marker.parentNode?.removeChild(this.marker);
  }
}
