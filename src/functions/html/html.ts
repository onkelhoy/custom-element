import { AttributePart, CommentPart, EventPart } from "./parts";
import { Part } from "./types";


// Metadata map to associate root elements with their dynamic values
// Used to store the latest set of values applied to a rendered template
const metadataMap = new WeakMap<Element, any[]>();

// Cache storing compiled root elements per unique template literal strings array
// Prevents re-parsing and re-creating DOM for the same template literal strings
const cachedElements = new WeakMap<TemplateStringsArray, Element>();

/**
 * The main `html` tagged template function.
 * Accepts a template literal strings array and values,
 * compiles or retrieves cached root element,
 * and stores the dynamic values metadata.
 * 
 * @param templateStringArray Template literal strings array (the static parts of the template)
 * @param values Dynamic values passed into the template literal
 * @returns Root Element representing the compiled template DOM
 */
export function html(templateStringArray: TemplateStringsArray, ...values: unknown[]): Element {
  // Compile or get cached DOM for this template string array
  const root = compile(templateStringArray);

  // Store the dynamic values associated with this root element
  metadataMap.set(root, values);

  return root;
}

/**
 * Compiles the template strings array into a root Element.
 * Caches the resulting Element for future calls with the same template.
 * 
 * @param templateStringArray The template literal strings array
 * @returns Root Element of the compiled template
 */
function compile(templateStringArray: TemplateStringsArray): Element {
  // Return cached root element if it exists
  if (cachedElements.has(templateStringArray)) {
    return cachedElements.get(templateStringArray)!;
  }

  // Create a <template> element for safe HTML parsing
  const template = document.createElement('template');

  // This flag helps fix attribute quoting issues by adding quotes where needed
  let expectQuote = false;

  // Join template strings inserting comment markers to mark dynamic parts
  template.innerHTML = templateStringArray.map((str) => {
    let fixedStr = str;

    // If last string ended with '=', ensure next string starts with '"'
    if (expectQuote) {
      if (!fixedStr.startsWith('"')) fixedStr = '"' + fixedStr;
      expectQuote = false;
    }

    // If current string ends with '=', prepare to add opening quote next time
    if (fixedStr.endsWith('=')) {
      fixedStr += '"';
      expectQuote = true;
    }

    return fixedStr;
  }).join('<!--marker-->');

  // Clone content from the template element to create a DocumentFragment
  const fragment = template.content.cloneNode(true) as DocumentFragment;

  // Normalize the fragment into a root Element (unwraps single node or wraps multiple in a div)
  const root = normalizeRoot(fragment);

  (root as any).__isTemplateRoot = true;

  // Cache the compiled root element for reuse
  cachedElements.set(templateStringArray, root);

  return root;
}

/**
 * Retrieves the stored dynamic values metadata associated with a root element.
 * 
 * @param element Root element created by `html` function
 * @returns Array of dynamic values or undefined if none stored
 */
export function getValues(element: Element) {
  return metadataMap.get(element);
}

/**
 * Checks if a text node is empty or contains only whitespace.
 * 
 * @param node The node to check
 * @returns True if the node is a text node and empty/whitespace only
 */
function isEmptyTextNode(node: Node): boolean {
  return (
    node.nodeType === Node.TEXT_NODE &&
    !/\S/.test(node.textContent || '')
  );
}

/**
 * Normalizes a DocumentFragment into a single root Element.
 * - If no children or only empty text nodes: returns an empty <div>
 * - If exactly one child node:
 *    - If element node, returns it directly
 *    - Otherwise wraps it in a <div>
 * - If multiple child nodes, wraps them in a <div>
 * 
 * This ensures the template always returns an Element as root.
 * 
 * @param fragment DocumentFragment containing template content
 * @returns Root Element for the template
 */
function normalizeRoot(fragment: DocumentFragment): Element {
  // Filter out empty text nodes among direct children
  const filteredChildren = Array.from(fragment.childNodes).filter(
    (node) => !isEmptyTextNode(node)
  );

  if (filteredChildren.length === 0) {
    // No non-empty children - return empty div as fallback
    return document.createElement('div');
  }
  
  if (filteredChildren.length === 1) {
    const single = filteredChildren[0];
    // If single child is an element, return it directly
    if (single.nodeType === Node.ELEMENT_NODE) return single as Element;
    
    // Otherwise, wrap it in a div to ensure an Element is returned
    const wrapper = document.createElement('div');
    wrapper.appendChild(single);
    return wrapper;
  }
  
  // Multiple children - wrap all in a div container
  const wrapper = document.createElement('div');
  filteredChildren.forEach((node) => wrapper.appendChild(node));
  return wrapper;
}

