import { PapElement, papHTML } from "./types";
const parser = new DOMParser();

export function html(strings: TemplateStringsArray, ...values: any[]):papHTML {
  const htmlString = strings.reduce((acc, str, i) => acc + str + (values[i] || ""), "");
  const dom = parser.parseFromString(htmlString, "text/html");
  const papDOM = Array.from(dom.body.childNodes).map(createPapElement).filter(item => !!item);

  return {
    dom,
    papDOM,
  }
}

function createPapElement(node: Node):PapElement|null {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.textContent?.trim() === "") return null;

    // Handle TextNode
    return {
      tagName: "", // TextNode doesn't have a tag name
      attributes: {}, // TextNode doesn't have attributes
      events: {}, // TextNode doesn't have events
      children: [], // TextNode doesn't have children
      text: node.textContent, // Use the text content
    };
  }

  // Handle Element
  const element = node as Element;

  return {
    tagName: element.tagName.toLowerCase(), // Normalize tag name
    attributes: Object.fromEntries(
      Array.from(element.attributes).map((attr) => [attr.name, attr.value])
    ),
    events: {}, // Events are added separately
    children: Array.from(element.childNodes).map(createPapElement).filter(item => !!item), // Recursively process children
    text: null, // Elements don't have direct text content
  };
} 