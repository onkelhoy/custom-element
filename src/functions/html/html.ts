import { AttributePart, CommentPart, EventPart } from "./parts";
import { Metadata, Part } from "./types";

// Cache for compiled templates
const templateCache = new WeakMap<TemplateStringsArray, HTMLTemplateElement>();

// Metadata map holding info per rendered root node
const metadataMap = new WeakMap<Element | DocumentFragment, Metadata>();

// The `html` tagged template function
export function html(strings: TemplateStringsArray, ...values: any[]): Element {
  // 1. Compile or get cached template
  const template = getOrCompileTemplate(strings);

  // 2. Clone DOM from template content
  const fragment = template.content.cloneNode(true) as DocumentFragment;

  // 3. Determine root element (first element child or the fragment itself)
  // const root: Element | DocumentFragment = fragment.firstElementChild ?? fragment;
  const root = normalizeRoot(fragment);

  // 4. Find dynamic parts and create update logic
  const parts: Part[] = findParts(root, values);

  // 5. Save metadata externally in WeakMap
  metadataMap.set(root, {
    parts,
    lastValues: values,
    update(newValues: any[], initial = false) {
      for (let i = 0; i < parts.length; i++) {
        if (initial || this.lastValues[i] !== newValues[i]) {
          parts[i].apply(newValues[i], this.lastValues[i]);
          this.lastValues[i] = newValues[i];
        }
      }
    },
  });

  // 6. Return the actual HTMLElement or DocumentFragment
  return root;
}

export function getMetadata(element: Element): Metadata | undefined {
  return metadataMap.get(element);
}

// helper functions 
function normalizeRoot(fragment: DocumentFragment): Element {
  function isEmptyTextNode(node: Node): boolean {
    return (
      node.nodeType === Node.TEXT_NODE &&
      !/\S/.test(node.textContent || '')
    );
  }

  // Filter out all empty text nodes among direct children
  const filteredChildren = Array.from(fragment.childNodes).filter(
    (node) => !isEmptyTextNode(node)
  );

  if (filteredChildren.length === 0) {
    // If all children were empty, return empty div
    return document.createElement('div');
  } else if (filteredChildren.length === 1) {
    const single = filteredChildren[0];
    // Return Element or TextNode as-is
    if (single.nodeType === Node.ELEMENT_NODE) {
      return single as Element;
    } else {
      // Other node types? Wrap in div to be safe
      const wrapper = document.createElement('div');
      wrapper.appendChild(single);
      return wrapper;
    }
  } else {
    // Multiple nodes — wrap in div container
    const wrapper = document.createElement('div');
    filteredChildren.forEach((node) => wrapper.appendChild(node));
    return wrapper;
  }
}


// making sure template-string-array is propperly with quotes
function fixTemplateStringArray(templateStringArray: TemplateStringsArray): string[] {
  let expectQuote = false;

  return templateStringArray.map((str) => {
    let fixedStr = str;

    if (expectQuote) {
      if (!fixedStr.startsWith('"')) fixedStr = '"' + fixedStr;
      expectQuote = false;
    }

    if (fixedStr.endsWith('=')) {
      fixedStr += '"'
      expectQuote = true;
    }

    return fixedStr;
  });
}

// Get or compile the template for a given strings array
function getOrCompileTemplate(strings: TemplateStringsArray): HTMLTemplateElement {
  if (templateCache.has(strings)) {
    return templateCache.get(strings)!; // Non-null assertion since we checked
  }

  // Create a new template element
  const template = document.createElement('template');

  // Insert markers for dynamic parts — for simplicity, join with a marker
  template.innerHTML = fixTemplateStringArray(strings).join('<!--marker-->');

  // Cache the compiled template
  templateCache.set(strings, template);

  return template;
}

// Dummy example: findParts implementation returning empty parts for now
function findParts(root: Element, values: any[]): Part[] {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT
  );

  const parts: Part[] = [];
  let node = walker.nextNode();
  let valueIndex = 0;

  while (node) {
    if (node.nodeType === Node.COMMENT_NODE) {
      if (node.nodeValue === 'marker') {
        parts.push(new CommentPart(node));
        valueIndex++;
      }
    } 
    else if (node.nodeType === Node.ELEMENT_NODE) {

      const element = node as Element;
      for (let i=0; i<element.attributes.length; i++) {
        const attribute = element.attributes[i];
        if (attribute.value !== "<!--marker-->") continue;

        const eventMatch = attribute.name.match(/(on|@)(?<name>[^\s]+)/);
        if (eventMatch)
        {
          i--;
          element.removeAttribute(attribute.name);
          parts.push(new EventPart(element, eventMatch.groups?.name ?? eventMatch[2] ?? attribute.name));
        }
        else 
        {
          parts.push(new AttributePart(element, attribute.name));
        }

        valueIndex++;
      }
    }
    else 
    {
      console.warn('[html] unknown node-type', node.nodeType, node)
    }
    node = walker.nextNode();
  }

  return parts;
}
