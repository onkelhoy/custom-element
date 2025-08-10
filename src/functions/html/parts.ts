import { getValues } from "./html";
import { Part } from "./types";

/**
 * Scans the rendered template's DOM tree and creates "Part" objects
 * representing the dynamic placeholders that can be updated later.
 * 
 * Parts can be:
 *  - CommentPart → dynamic value between nodes (array or single slot)
 *  - AttributePart → dynamic attribute value
 *  - EventPart → dynamic event listener
 * 
 * @param root The root element containing the compiled template
 */
export function getParts(root: Element): Part[] {
  // Walker that visits only ELEMENT and COMMENT nodes (no text nodes)
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT
  );

  const parts: Part[] = [];
  let node: Node | null = walker.currentNode; // include the root itself
  let valueIndex = 0;

  while (node) {
    if (node.nodeType === Node.COMMENT_NODE) {
      // COMMENT nodes with exactly 'marker' mean a dynamic placeholder
      if (node.nodeValue === 'marker') {
        parts.push(new CommentPart(node as Comment));
        valueIndex++;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      // Check every attribute for a dynamic marker
      for (let i = 0; i < element.attributes.length; i++) {
        const attribute = element.attributes[i];

        // Only dynamic attributes have the value "<!--marker-->"
        if (attribute.value !== "<!--marker-->") continue;

        // Event handlers → names start with "on" or "@"
        const eventMatch = attribute.name.match(/(on|@)(?<name>[^\s]+)/);
        if (eventMatch) {
          // Remove it from the DOM because JS will handle the listener
          i--;
          element.removeAttribute(attribute.name);

          parts.push(new EventPart(
            element,
            eventMatch.groups?.name ?? eventMatch[2] ?? attribute.name
          ));
        } else {
          // Regular dynamic attribute (class, id, key, etc.)
          parts.push(new AttributePart(element, attribute.name));
        }

        valueIndex++;
      }
    } else {
      console.warn('[html] unknown node-type', node.nodeType, node);
    }

    node = walker.nextNode();
  }

  return parts;
}

/**
 * Represents one instance of a rendered template (DOM tree + dynamic parts).
 * Can update its parts efficiently without re-rendering everything.
 */
export class TemplateInstance {
  element: Element;
  parts: Part[];
  values: any[];

  constructor(element: Element) {
    this.element = element;
    const values = getValues(element) ?? [];
    this.parts = getParts(element);
    this.values = new Array(this.parts.length);
    this.update(values);
  }

  update(newValues: any[]) {
    const delayed:number[] = [];

    // Update all parts except CommentParts first (delayed for arrays)
    for (let i = 0; i < this.parts.length; i++) {
      if (this.parts[i] instanceof CommentPart) {
        delayed.push(i);
        continue;
      }
      this.updateItem(i, newValues[i]);
    }

    // Now update CommentParts (ensures attributes are set first)
    for (const i of delayed) {
      this.updateItem(i, newValues[i]);
    }
  }

  private updateItem(i:number, newValue: any) {
    const oldValue = this.values[i];
    if (!this.parts[i].compare(newValue, oldValue)) {
      this.parts[i].apply(newValue, oldValue);
      this.values[i] = newValue;
    }
  }

  destroy() {
    this.parts.forEach(p => p.clear());
    this.element.parentNode?.removeChild(this.element);
  }
}

/**
 * Handles a single DOM slot — can contain either:
 *  - A primitive (rendered as text)
 *  - A DOM node
 *  - Another TemplateInstance (nested template)
 */
class SinglePart implements Part {
  private marker: Node; // The comment node marking the slot's position
  private node: Node | null = null; // Current DOM node in this slot
  private nestedInstance: TemplateInstance | null = null;
  private currentValue: any = undefined;

  constructor(marker: Node) {
    this.marker = marker;
  }

  apply(value: any, oldValue: any): void {
    // Skip if value is unchanged
    if (this.compare(value, this.currentValue)) return;
    this.currentValue = value;

    // Handle nested template
    if ((value as any)?.__isTemplateRoot) {
      const element = value as Element;

      // If same nested template → just update values
      if (this.nestedInstance && this.nestedInstance.element === element) {
        const newValues = getValues(element);
        if (newValues) this.nestedInstance.update(newValues);
        return;
      }

      // Otherwise create new nested instance
      this.clear();
      this.nestedInstance = new TemplateInstance(element);
      this.marker.parentNode?.insertBefore(element, this.marker);
      return;
    }

    // If we had a nested template before → remove it
    if (this.nestedInstance) {
      this.clear();
    }

    // Handle DOM nodes directly
    let node: Node;
    if (value instanceof Node) {
      node = value;
    } else {
      if (value == null) {
        this.clear();
        return;
      }

      // If it's already a Text node → update its data
      if (this.node instanceof Text) {
        this.node.data = String(value);
        return;
      }

      node = document.createTextNode(String(value));
    }

    // Only replace node if it's different
    if (this.node !== node) {
      this.clear();
      this.node = node;
      this.marker.parentNode?.insertBefore(node, this.marker);
    }
  }

  clear(): void {
    if (this.node) {
      this.node.parentNode?.removeChild(this.node);
      this.node = null;
    }
    if (this.nestedInstance) {
      this.nestedInstance.destroy();
      this.nestedInstance = null;
    }
  }

  compare(value: any, oldValue: any): boolean {
    if (this.nestedInstance) return false;
    return value === oldValue;
  }
}

/**
 * Handles array or single value slots that are placed in COMMENT positions.
 * This is what powers `map`-style rendering with keys.
 */
class CommentPart implements Part {
  private marker: Comment;
  private map: Map<string, SinglePart> = new Map();

  constructor(marker: Comment) {
    this.marker = marker;
  }

  apply(value: any, oldValue: any) {
    if (value == null) {
      this.clear();
      return;
    }

    if (Array.isArray(value)) {
      // Map of old keys → old values for diffing
      const oldMap = new Map<any, any>();
      if (Array.isArray(oldValue)) {
        oldValue.forEach((ov, idx) => {
          oldMap.set(this.getKey(ov, idx), ov);
        });
      }

      const oldKeys = new Set(this.map.keys());

      // Reuse or create parts per item
      value.forEach((v, index) => {
        const key = this.getKey(v, index);
        const prev = oldMap.get(key);
        oldKeys.delete(key);
        this.applyItem(v, prev, key, true);
      });

      // Remove parts that no longer exist
      oldKeys.forEach(key => {
        this.map.get(key)?.clear();
        this.map.delete(key);
      });

      return;
    }

    // Single value case — always use same key
    const key = '__single';
    this.map.forEach((p, k) => {
      if (k !== key) {
        p.clear();
        this.map.delete(k);
      }
    });
    this.applyItem(value, oldValue, key);
  }

  /**
   * Finds the "key" for a value (used for diffing arrays):
   * - value.key (manual)
   * - element.getAttribute("key") (template key)
   * - element.__manualKey (manual attribute assigned in AttributePart)
   * - fallback to array index or map size
   */
  private getKey(value: any, index?: number) {
    if (value.key) return value.key;

    if (value instanceof Element) {
      const key = value.getAttribute("key");
      if (key === "<!--marker-->") {
        if ((value as any).__manualKey !== undefined) {
          return (value as any).__manualKey;
        }
      } else if (key != null) {
        return key;
      }
    }

    if (index != null) return index;

    return this.map.size;
  }

  private applyItem(
    value: any,
    oldValue: any,
    key: any,
    createNewMarker: boolean = false
  ) {
    if (key === undefined) key = this.getKey(value);

    let part = this.map.get(key);

    if (!part) {
      let marker = this.marker;
      if (createNewMarker) {
        marker = document.createComment('item-marker');
        this.marker.parentNode?.insertBefore(marker, this.marker);
      }
      part = new SinglePart(marker);
      this.map.set(key, part);
    }

    part.apply(value, oldValue);
  }

  clear(): void {
    this.map.forEach(node => node.clear());
    this.map.clear();
  }

  compare(a: any, b: any): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }
    return a === b;
  }
}

/**
 * Base for dynamic attribute and event parts.
 */
abstract class AttributeBase {
  protected readonly element: Element;
  protected readonly name: string;

  constructor(element: Element, name: string) {
    this.element = element;
    this.name = name;
  }

  clear() {
    this.element.removeAttribute(this.name);
  }

  compare(value: any, oldValue: any): boolean {
    return value === oldValue;
  }
}

/**
 * Handles regular dynamic attributes.
 * Special case: "key" sets __manualKey for diffing arrays.
 */
class AttributePart extends AttributeBase implements Part {
  apply(value: string|null, oldValue: string|null) {
    if (value === oldValue) return;

    if (!value) return this.clear();

    if (this.name === "key") {
      (this.element as any).__manualKey = value;
    }
    this.element.setAttribute(this.name, value);
  }
}

/**
 * Handles dynamic event listeners (e.g., onclick, @click).
 */
class EventPart extends AttributeBase {
  apply(
    newListener: EventListenerOrEventListenerObject | null,
    oldListener?: EventListenerOrEventListenerObject | null
  ) {
    if (oldListener) {
      this.element.removeEventListener(this.name as keyof ElementEventMap, oldListener);
    }
    if (newListener) {
      this.element.addEventListener(this.name as keyof ElementEventMap, newListener);
    }
  }
}
