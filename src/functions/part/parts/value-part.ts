import type { Part, PartHelpers } from "@functions/part/types";

/**
 * Handles dynamic values in a template, replacing a marker comment with
 * strings, DOM nodes, or nested template instances, and efficiently updating
 * them without re-rendering the full template.
 */
export class ValuePart implements Part {
  private value: any = null;
  private node: Node | null = null;
  private nestedInstance: Part | null = null;

  constructor(
    private marker: Comment,
    private helpers: PartHelpers
  ) {}

  apply(newValue: any) {
    if (!newValue && newValue != 0) return void this.clear();
    if (newValue === this.value) return;
    this.value = newValue;

    // --- 1. Handle nested template (pure Element from html())
    if (newValue instanceof Element && (newValue as any).__isTemplateRoot) {
      if (this.nestedInstance == null) {
        this.clear();
        this.nestedInstance = this.helpers.createPart({
          kind: "nested",
          marker: this.marker, // reuse the same marker 
        });
      }
      this.nestedInstance.apply(newValue);
      return;
    }

    // --- 2. Handle DOM nodes directly
    if (newValue instanceof Node) {
      if (newValue === this.node) return; // skip same node
      this.clear();
      this.node = newValue;
      this.insert(newValue);
      return;
    }

    // --- 3. Everything else → string
    const str = newValue != null ? String(newValue) : "";
    if (this.node instanceof Text) {
      this.node.data = str;
      return;
    }
    this.clear();
    this.node = document.createTextNode(str);
    this.insert(this.node);
  }

  private insert(node: Node) {
    this.marker.parentNode?.insertBefore(node, this.marker);
  }


  clear() {
    // Remove DOM node if present
    if (this.node && this.node.parentNode) {
      this.node.parentNode.removeChild(this.node);
    }
    this.node = null;

    // Clear nested instance if present
    if (this.nestedInstance) {
      this.nestedInstance.clear();
      this.nestedInstance = null;
    }

    this.value = null;
  }

  remove() {
    this.clear();
    this.nestedInstance?.remove();
    this.marker.parentNode?.removeChild(this.marker);
  }
}
