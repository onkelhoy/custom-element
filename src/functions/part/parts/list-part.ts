import type { Part, PartHelpers } from "@functions/part/types";

/**
 * Manages a dynamic list of parts anchored before a marker.
 * Creates, updates, and removes item parts as the bound array changes.
 */
export class ListPart implements Part {
  private itemParts: Part[] = [];
  private itemValues: any[] = [];

  constructor(
    private marker: Comment,
    private helpers: PartHelpers
  ) {}

  apply(newValue: any) {
    if (!Array.isArray(newValue)) {
      this.clear();
      return;
    }

    const oldLength = this.itemParts.length;
    const newLength = newValue.length;

    // Update or create parts for each new item
    for (let i = 0; i < newLength; i++) {
      const item = newValue[i];
      const oldItemValue = this.itemValues[i];

      if (i < oldLength) {
        // Update existing part
        this.itemParts[i].apply(item, oldItemValue);
      } else {
        // Create new ValuePart-like thing for the item
        const comment = document.createComment("item-marker");
        this.marker.parentNode?.insertBefore(comment, this.marker);

        const part = this.createItemPart(comment);
        part.apply(item);
        this.itemParts.push(part);
      }
    }

    // Remove any leftover parts if list got shorter
    if (newLength < oldLength) {
      for (let i = newLength; i < oldLength; i++) {
        this.itemParts[i].remove();
      }
      this.itemParts.length = newLength;
    }

    this.itemValues = newValue.slice();
  }

  private createItemPart(marker: Comment): Part {
    // Reuse the factory to create a value part
    return this.helpers.createPart({
      kind: 'value',
      marker,
    }); 
  }

  clear() {
    for (const part of this.itemParts) {
      part.clear();
    }
    this.itemParts = [];
    this.itemValues = [];

    // Remove all nodes between marker and next marker (or end)
    let node = this.marker.previousSibling;
    while (node && !(node instanceof Comment && node === this.marker)) {
      const prev = node.previousSibling;
      node.parentNode?.removeChild(node);
      node = prev;
    }
  }

  remove() {
    this.clear();
    this.marker.parentNode?.removeChild(this.marker);
  }
}
