import { Part } from "./types";


export class TextPart implements Part {
  private textNode: Text;

  constructor(textNode: Text) {
    this.textNode = textNode;
  }

  apply(value:string|null) {
    this.textNode.textContent = value;
  }
}

export class CommentPart implements Part {
  private node: Node;

  constructor(node: Node) {
    this.node = node;
  }

  apply(value:string|null) {
    this.node.textContent = value;
  }
}

class AttributeBase {
  protected readonly element: Element;
  protected readonly name: string;

  constructor(element: Element, name: string) {
    this.element = element;
    this.name = name;
  }
}

export class AttributePart extends AttributeBase implements Part {
  apply(value: string|null, oldValue: string|null) {
    if (value === oldValue) return 

    if (!value) return this.element.removeAttribute(this.name);

    this.element.setAttribute(this.name, value);
  }
}

export class EventPart extends AttributeBase {
  private currentListener: EventListenerOrEventListenerObject | null = null;

  apply(newListener: EventListenerOrEventListenerObject | null, oldListener?: EventListenerOrEventListenerObject | null) {

    console.log('EVENT APPLY', this.element)

    if (oldListener) {
      this.element.removeEventListener(this.name as keyof ElementEventMap, oldListener);
    }
    if (newListener) {
      this.element.addEventListener(this.name as keyof ElementEventMap, newListener);
    }
    this.currentListener = newListener;
  }
}