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
    if ((value as any)?.__isTemplateResult) {
      // If we already have a TemplateInstance for a previous element
      if (this.nestedInstance && this.nestedInstance.element === value) {
        // Just update it with new values
        const newValues = getValues(value);
        if (newValues) this.nestedInstance.update(newValues);
        return;
      }

      this.clear(); // Remove old content
      const el = value as Element;
      this.nestedInstance = new TemplateInstance(el);
      this.marker.parentNode?.insertBefore(el, this.marker);
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
      if (value == null) return;
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
    if (a === b) return true;

    // If both are nested templates, compare the root elements
    if (a?.__isTemplateResult && b?.__isTemplateResult) {
      return a === b; // or you could check some ID or template tag identity
    }

    return false;
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

// import { Part } from "./types";


// type CommentPrimitiveType = Object | Function | Node | string | null | number | boolean | undefined;
// type CommentType = CommentPrimitiveType | Array<CommentPrimitiveType>;
// export class CommentPart implements Part {
//   private marker: Comment;
//   private currentNodes: Node[] = [];
//   private subParts: Part[] = [];

//   constructor(marker: Comment) {
//     this.marker = marker;
//     console.log(marker);
//   }

//   private applyArray(value: Array<CommentPrimitiveType>, old: CommentType) {
//     console.log('too be implememted later')


//     // // Normalize to array for easier handling
//     // const values = Array.isArray(value) ? value : [value];
//     // const fvalues = values.filter(item => item != null);
//     // if (fvalues.length === 0) return;

//     // const fragment = document.createDocumentFragment();
//     // for (const item of values) {
//     //   let node: Node;
//     //   if (typeof item === "string") {
//     //     node = document.createTextNode(item);
//     //   } else if (item instanceof Node) {
//     //     node = item;
//     //   } else {
//     //     // fallback (e.g. numbers, booleans, etc.)
//     //     node = document.createTextNode(String(item));
//     //   }

//     //   fragment.appendChild(node);
//     //   this.currentNodes.push(node);
//     // }

//     // this.marker.parentNode?.insertBefore(fragment, this.marker);
//   }

//   private applyNode(node: Node, old: CommentType) {
//     if ((node as any).__isTemplateRoot)
//     {
//       const element = node as Element;
//       console.log('APPLY NODES')
//       const parts = getParts(element);
//       const values = getValues(element) ?? [];
//       console.log('node parts', element, parts)
//       parts.forEach((p, i) => {
//         const value = values[i];
//         p.apply(value, undefined);
//         this.subParts.push(p);
//       });
//       // this.subParts.push(...);
//     }

//     this.marker.parentNode?.insertBefore(node, this.marker);
//   }
//   private applyFunction(value: Function, old: CommentType) {
//     console.log('apply function?')
//   }
//   private applyObject(value: Object, old: CommentType) {
//     console.log('apply object?')
//   }

//   apply(value: CommentType, old: CommentType) {
//     this.clear();

//     if (value == null || value === undefined) return;

//     if (Array.isArray(value)) return void this.applyArray(value, old);
//     if (value instanceof Node) return void this.applyNode(value, old);
//     if (value instanceof Function) return void this.applyFunction(value, old);
//     if (value instanceof Object) return void this.applyObject(value, old);
    
//     // its a primitive type ? 
//     const node = document.createTextNode(String(value));
//     this.currentNodes.push(node);
//     this.marker.parentNode?.insertBefore(node, this.marker);
//   }

//   compare(value: CommentType, oldValue: CommentType): boolean {

//     if (Array.isArray(value))
//     {
//       if (!Array.isArray(oldValue)) return false;
//       if (value.length !== oldValue.length) return false;
//       const notequal = value.some((v, i) => !this.compare(v, oldValue[i]));
//       return !notequal;
//     }
//     // if (value instanceof Node) return void this.applyNode(value, old);
//     // if (value instanceof Function) return void this.applyFunction(value, old);
//     // if (value instanceof Object) return void this.applyObject(value, old);

//     return value === oldValue;
//   }

//   // Clear method for removing all nodes of this part
//   clear() {
//     this.currentNodes.forEach(node => node.parentNode?.removeChild(node));
//     this.currentNodes = [];
//     this.subParts.forEach(part => part.clear());
//     this.subParts = [];
//   }
// }


// class CommentPart implements Part {
//   private marker: Comment;
//   private node: Node|null = null;
//   private subParts: Part[] = [];

//   constructor(marker: Comment) {
//     this.marker = marker;
//   }
//   apply(value: any, oldValue: any): void {
//     this.clear();
//     if (value === null) return;

//     if (value instanceof Node) 
//     {
//       this.node = value;

//       if ((value as any).__isTemplateRoot)
//       {
//         const element = value as Element;
//         const parts = getParts(element);
//         const values = getValues(element) ?? [];

//         parts.forEach((part, i) => {
//           part.apply(values[i], undefined);
//         });

//         this.subParts = parts;

//         // this.marker.parentNode?.insertBefore(cloned, this.marker);
//         // return;
//       }
//     }
//     else 
//     {
//       this.node = document.createTextNode(value);
//     }

//     this.marker.parentNode?.insertBefore(this.node, this.marker);
//   }
//   clear(): void {
//     if (!this.node) return;
//     this.node.parentNode?.removeChild(this.node);
//     this.node = null;
//   }
//   compare(value: any, oldValue: any): boolean {
//     return value === oldValue;
//   }
// } 


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