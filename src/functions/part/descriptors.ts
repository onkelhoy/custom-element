import { PartDescriptor } from "./types";

/**
 * Extracts "part descriptors" from a DOM element tree.
 *
 * A part descriptor is metadata that describes a dynamic section
 * of the DOM (e.g. a value placeholder, a list placeholder, a dynamic
 * attribute, or an event binding). These are later turned into `Part`
 * objects by the `partFactory` inside `TemplateInstance`.
 *
 * @param {Element} root - The root DOM element of the rendered template.
 * @returns {PartDescriptor[]} An array of descriptors representing dynamic
 * parts of the template.
 */
export function getDescriptors(root: Element): PartDescriptor[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
  let node: Node | null = walker.currentNode;
  const descriptors: PartDescriptor[] = [];

  while (node) 
  {
    if (node.nodeType === Node.COMMENT_NODE) 
    {
      if (node.nodeValue === 'list-marker') descriptors.push({ kind: 'list', marker: node as Comment });
      else if (node.nodeValue === 'marker') descriptors.push({ kind: 'value', marker: node as Comment });
    } 
    else if (node.nodeType === Node.ELEMENT_NODE) 
    {
      const el = node as Element;
      for (const attr of Array.from(el.attributes)) 
      {
        console.log('attr', attr.name, attr.value)
        if (attr.value === '<!--marker-->') 
        {
          const eventMatch = attr.name.match(/^(on|@)(?<name>.*)/);
          if (eventMatch) 
          {
            el.removeAttribute(attr.name);
            descriptors.push({ kind: 'event', element: el, name: eventMatch.groups?.name! });
          }
          else descriptors.push({ kind: 'attr', element: el, name: attr.name });
        }
      }
    }
    node = walker.nextNode();
  }
  return descriptors;
}
