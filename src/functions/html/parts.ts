import { getValues } from "./html";
import { Part } from "./types";


/**
 * Traverses the template root element to find all dynamic parts:
 * - Comment parts (e.g. markers between dynamic values)
 * - Attribute parts where attribute value is a marker
 * - Event parts (attributes starting with 'on' or '@')
 * 
 * Returns an array of Part instances for all found dynamic parts.
 * 
 * @param root The root Element of the compiled template
 * @returns Array of Part instances representing dynamic bindings
 */
export function getParts(root: Element): Part[] {
  // TreeWalker to iterate over elements and comment nodes only
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT
  );

  const parts: Part[] = [];
  let node = walker.nextNode();
  let valueIndex = 0;

  while (node) {
    if (node.nodeType === Node.COMMENT_NODE) {
      // Comments with value 'marker' represent dynamic value spots
      if (node.nodeValue === 'marker') {
        parts.push(new CommentPart(node as Comment));
        valueIndex++;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // For elements, check attributes for markers indicating dynamic bindings
      const element = node as Element;

      for (let i = 0; i < element.attributes.length; i++) {
        const attribute = element.attributes[i];

        // Only attributes with value '<!--marker-->' are dynamic parts
        if (attribute.value !== "<!--marker-->") continue;

        // Check if attribute is an event handler (starts with 'on' or '@')
        const eventMatch = attribute.name.match(/(on|@)(?<name>[^\s]+)/);
        if (eventMatch) {
          // Remove event attribute since it'll be handled separately
          i--;
          element.removeAttribute(attribute.name);

          // Create an EventPart with event name extracted from regex groups
          parts.push(new EventPart(element, eventMatch.groups?.name ?? eventMatch[2] ?? attribute.name));
        } else {
          // Otherwise it's a regular attribute binding
          parts.push(new AttributePart(element, attribute.name));
        }

        valueIndex++;
      }
    } else {
      // Unexpected node type (shouldn't happen here)
      console.warn('[html] unknown node-type', node.nodeType, node);
    }
    node = walker.nextNode();
  }

  return parts;
}

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
    for (let i = 0; i < this.parts.length; i++) {
      const newValue = newValues[i];
      const oldValue = this.values[i];

      if (!this.parts[i].compare(newValue, oldValue)) {
        this.parts[i].apply(newValue, oldValue);
        this.values[i] = newValue;
      }
    }
  }

  destroy() {
    this.parts.forEach(p => p.clear());
    this.element.parentNode?.removeChild(this.element);
  }
}

/* keep your existing TemplateInstance implementation (unchanged) */

type Meta = {
  instance?: TemplateInstance;
  node: Node;
}

/* -------------------- SinglePart (small additions) -------------------- */
class SinglePart implements Part {
  private marker: Node;
  private node: Node | null = null;
  private nestedInstance: TemplateInstance | null = null;
  private currentValue: any = undefined;

  constructor(marker: Node) {
    this.marker = marker;
  }

  apply(value: any, oldValue: any): void {
    if (this.compare(value, this.currentValue)) return;
    this.currentValue = value;

    // Template root handling (same behavior as before)
    if ((value as any)?.__isTemplateRoot) {
      const element = value as Element;

      if (this.nestedInstance && this.nestedInstance.element === element) {
        // Update existing instance in-place
        const newValues = getValues(element);
        if (newValues) this.nestedInstance.update(newValues);
        return;
      }

      this.clear();
      this.nestedInstance = new TemplateInstance(element);
      // Insert element at marker (caller will reorder later if needed)
      this.marker.parentNode?.insertBefore(element, this.marker);
      return;
    }

    // If previously had a nested instance, clear it
    if (this.nestedInstance) {
      this.clear();
    }

    // Node or primitive -> text node
    let node: Node;
    if (value instanceof Node) {
      node = value;
    } else {
      if (value == null) {
        this.clear();
        return;
      }

      if (this.node instanceof Text) {
        // ✅ update in-place instead of appending new values
        this.node.data = String(value);
        return;
      }
      
      node = document.createTextNode(String(value));
    }

    // Avoid unnecessary DOM ops if same node object
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


class CommentPart implements Part {
  private marker: Comment;
  private list: SinglePart[] = [];
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
      // const oldKeys = new Set(this.map.keys());
      // const oldValues = Array.isArray(oldValue) ? oldValue : [];

      // value.forEach((v, index) => {
      //   const key = this.getKey(v, index);
      //   oldKeys.delete(key);
      //   this.applyItem(v, oldValues[index], key, true);
      // });

      // // remove stale parts
      // oldKeys.forEach(key => {
      //   this.map.get(key)?.clear();
      //   this.map.delete(key);
      // });
      // return;
      const oldMap = new Map<any, any>();
      if (Array.isArray(oldValue)) {
        oldValue.forEach((ov, idx) => {
          oldMap.set(this.getKey(ov, idx), ov);
        });
      }

      const oldKeys = new Set(this.map.keys());

      value.forEach((v, index) => {
        const key = this.getKey(v, index);
        const prev = oldMap.get(key);
        oldKeys.delete(key);
        this.applyItem(v, prev, key, true);
      });

      // remove stale parts
      oldKeys.forEach(key => {
        this.map.get(key)?.clear();
        this.map.delete(key);
      });

      return;
    }

    // single value → always use same key
    const key = '__single';
    this.map.forEach((p, k) => {
      if (k !== key) {
        p.clear();
        this.map.delete(k);
      }
    });
    this.applyItem(value, oldValue, key);
  }

  private getKey(value: any, index?: number) {
    if (value.key) return value.key;

    if (value instanceof Element) 
    {
      const key = value.getAttribute("key");
      if (key != null) return key;
    }

    if (index != null) return index;

    return this.map.size;
  }

  private applyItem(value: any, oldValue: any, key: any, createNewMarker: boolean = false) {
    if (key === undefined) key = this.getKey(value);
    let part = this.map.get(key);

    if (!part) {
      let marker = this.marker;
      if (createNewMarker)
      {
        marker = document.createComment('item-marker');
        // insert this new marker before the main marker
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
    // Handle array case: compare length + each item shallowly
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }
    
    // Simple equality for non-array
    return a === b;
  }
}

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

class AttributePart extends AttributeBase implements Part {
  apply(value: string|null, oldValue: string|null) {
    if (value === oldValue) return 

    if (!value) return this.clear();

    this.element.setAttribute(this.name, value);
  }
}

class EventPart extends AttributeBase {

  apply(newListener: EventListenerOrEventListenerObject | null, oldListener?: EventListenerOrEventListenerObject | null) {
    if (oldListener) {
      this.element.removeEventListener(this.name as keyof ElementEventMap, oldListener);
    }
    if (newListener) {
      this.element.addEventListener(this.name as keyof ElementEventMap, newListener);
    }
  }
}
