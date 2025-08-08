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

type CommentPrimitiveType = Node | string | null | number | boolean | undefined;
export class CommentPart implements Part {
  private marker: Comment;
  private currentNodes: Node[] = [];
  private subParts: Part[] = [];

  constructor(marker: Comment) {
    this.marker = marker;
  }

  apply(value: CommentPrimitiveType | Array<CommentPrimitiveType>, old: CommentPrimitiveType | Array<CommentPrimitiveType>) {
    // Remove previous inserted nodes
    this.currentNodes.forEach(node => {
      node.parentNode?.removeChild(node);
    });
    this.currentNodes = [];

    if (value == null || value === undefined) return;

    // Normalize to array for easier handling
    const values = Array.isArray(value) ? value : [value];
    const fvalues = values.filter(item => item != null);
    if (fvalues.length === 0) return;

    const fragment = document.createDocumentFragment();
    for (const item of values) {
      let node: Node;
      if (typeof item === "string") {
        node = document.createTextNode(item);
      } else if (item instanceof Node) {
        node = item;
      } else {
        // fallback (e.g. numbers, booleans, etc.)
        node = document.createTextNode(String(item));
      }

      fragment.appendChild(node);
      this.currentNodes.push(node);
    }

    this.marker.parentNode?.insertBefore(fragment, this.marker);
  }

  // Clear method for removing all nodes of this part
  clear() {
    this.currentNodes.forEach(node => node.parentNode?.removeChild(node));
    this.currentNodes = [];
    this.subParts.forEach(part => part.clear());
    this.subParts = [];
  }
}

class AttributeBase {
  protected readonly element: Element;
  protected readonly name: string;

  constructor(element: Element, name: string) {
    this.element = element;
    this.name = name;
  }

  clear() {
    this.element.removeAttribute(this.name);
  }
}

export class AttributePart extends AttributeBase implements Part {
  apply(value: string|null, oldValue: string|null) {
    if (value === oldValue) return 

    if (!value) return this.clear();

    this.element.setAttribute(this.name, value);
  }
}

export class EventPart extends AttributeBase {
  private currentListener: EventListenerOrEventListenerObject | null = null;

  apply(newListener: EventListenerOrEventListenerObject | null, oldListener?: EventListenerOrEventListenerObject | null) {
    if (oldListener) {
      this.element.removeEventListener(this.name as keyof ElementEventMap, oldListener);
    }
    if (newListener) {
      this.element.addEventListener(this.name as keyof ElementEventMap, newListener);
    }
    this.currentListener = newListener;
  }
}

// import { Part } from "./types";

// type CommentPrimitiveType = Element | string | null | number | boolean;
// export class CommentPart implements Part {
//   private marker: Comment;
//   private currentNodes: Node[] = [];

//   constructor(marker: Comment) {
//     this.marker = marker;
//   }

//   apply(value: CommentPrimitiveType | Array<CommentPrimitiveType>, old: CommentPrimitiveType | Array<CommentPrimitiveType>) {
//     // Remove previous inserted nodes
//     this.currentNodes.forEach(node => {
//       node.parentNode?.removeChild(node);
//     });
//     this.currentNodes = [];

//     if (value == null || value === undefined) return;

//     // Normalize to array for easier handling
//     const values = Array.isArray(value) ? value : [value];
//     const fvalues = values.filter(item => item != null);
//     if (fvalues.length === 0) return;

//     const fragment = document.createDocumentFragment();
//     for (const item of values) {
//       let node: Node;
//       if (typeof item === "string") {
//         node = document.createTextNode(item);
//       } else if (item instanceof Node) {
//         node = item;
//       } else {
//         // fallback (e.g. numbers, booleans, etc.)
//         node = document.createTextNode(String(item));
//       }

//       fragment.appendChild(node);
//       this.currentNodes.push(node);
//     }

//     this.marker.parentNode?.insertBefore(fragment, this.marker);
//   }
// }

// class AttributeBase {
//   protected readonly element: Element;
//   protected readonly name: string;

//   constructor(element: Element, name: string) {
//     this.element = element;
//     this.name = name;
//   }
// }

// export class AttributePart extends AttributeBase implements Part {
//   apply(value: string|null, oldValue: string|null) {
//     if (value === oldValue) return 

//     if (!value) return this.element.removeAttribute(this.name);

//     this.element.setAttribute(this.name, value);
//   }
// }

// export class EventPart extends AttributeBase {
//   private currentListener: EventListenerOrEventListenerObject | null = null;

//   apply(newListener: EventListenerOrEventListenerObject | null, oldListener?: EventListenerOrEventListenerObject | null) {
//     if (oldListener) {
//       this.element.removeEventListener(this.name as keyof ElementEventMap, oldListener);
//     }
//     if (newListener) {
//       this.element.addEventListener(this.name as keyof ElementEventMap, newListener);
//     }
//     this.currentListener = newListener;
//   }
// }