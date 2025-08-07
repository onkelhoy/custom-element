import type { NodeInfo, papHTML } from "@html/types";

export function Render(strings: TemplateStringsArray, ...values: any[]):papHTML {
  
  let htmlStrings: string[] = [];
  const events: Record<string, [string, Function]> = {};

  for (let i=0; i<strings.length; i++) {
    let text = strings[i];
    let value = values[i] ?? "";

    if (typeof value === "function")
    {
      // the function name is from the last text and up 
      const attributeMatch = text.match(/(@|on)(?<name>[^\s]+)=$/);
      if (attributeMatch == null)
      {
        throw new Error("[error] could not extract attribute-name");
      }
      
      text = text.replace(attributeMatch[0], `data-pap-event-${i}="${i}"`);
      events[String(i)] = [attributeMatch.groups?.name ?? attributeMatch[2], value];

      value = "";
    }

    htmlStrings.push(text + value);
  }

  const template = document.createElement("template");
  template.innerHTML = htmlStrings.join("");

  const dom = template.content;
  const papDOM = Array.from(dom.childNodes).map(node => compile(node, events)).filter(item => !!item);

  return {
    dom,
    papDOM,
  };
}

function compile(node: Node, events: Record<string, [string, Function]>): NodeInfo|null {

  if (node.nodeType === Node.TEXT_NODE) {
    if (node.textContent?.trim() === "") {
      node.parentNode?.removeChild(node);
      return null;
    }
    return {
      tagName: "TEXT", // TextNode doesn't have a tag name
      attributes: {}, // TextNode doesn't have attributes
      events: {}, // TextNode doesn't have events
      children: [], // TextNode doesn't have children
      text: node.textContent, // Use the text content
    };
  }

  // Handle Element
  const element = node as Element;
  const attributes:Record<string,string> = {};
  const eventMap: Record<string, Function> = {};
  Array.from(element.attributes).forEach((attr) => {
    if (attr.name.startsWith("data-pap-event"))
    {
      // remove this attribute 
      element.removeAttribute(attr.name);
      const event = events[attr.value];

      if (!event) return;
      eventMap[event[0]] = event[1];
      element.addEventListener(event[0], event[1] as EventListenerOrEventListenerObject);
      return;
    }

    attributes[attr.name] = attr.value;
  });

  return {
    tagName: element.tagName.toLowerCase(), // Normalize tag name
    attributes,
    events: eventMap, // Events are added separately
    children: Array.from(element.childNodes).map(child => compile(child, events)).filter(node => !!node), // Recursively process children
    text: null, // Elements don't have direct text content
  };
}
