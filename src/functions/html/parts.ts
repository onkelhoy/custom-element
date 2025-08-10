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
  }
}

class CommentPart implements Part {
  private marker: Comment;
  private node: Node | null = null;
  private nestedInstance: TemplateInstance | null = null;

  constructor(marker: Comment) {
    this.marker = marker;
  }

  apply(value: any, oldValue: any): void {
    // Case 1: New value is a nested template
    if ((value as any)?.__isTemplateRoot) {
      const element = value as Element;

      // If we already have a TemplateInstance for a previous element
      if (this.nestedInstance && this.nestedInstance.element === element) {
        // Just update it with new values
        const newValues = getValues(element);
        if (newValues) this.nestedInstance.update(newValues);
        return;
      }

      this.clear(); // Remove old content
      this.nestedInstance = new TemplateInstance(element);
      this.marker.parentNode?.insertBefore(element, this.marker);
      return;
    }

    // If we previously rendered a nested template, remove it
    if (this.nestedInstance) {
      this.clear();
    }

    // Case 2: Primitive or Node
    let node: Node;
    if (value instanceof Node)
    {
      node = value;
    }
    else
    {
      if (value == null) return void this.clear();
      node = document.createTextNode(String(value));
    }

    // Avoid unnecessary DOM manipulation
    if (this.node !== node) {
      this.clear(); // Remove previous text node
      this.node = node;
      this.marker.parentNode?.insertBefore(node, this.marker);
    }
  }

  clear(): void {
    if (this.node) {
      if (this.node.parentNode) this.node.parentNode.removeChild(this.node);
      this.node = null;
    }

    if (this.nestedInstance) {
      this.nestedInstance.destroy();
      this.nestedInstance.element.remove();
      this.nestedInstance = null;
    }
  }

  compare(a: any, b: any): boolean {
    // Always update nested instances (not the best!)
    if (this.nestedInstance) return false;

    // Primitives or nodes
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
