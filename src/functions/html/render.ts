import type { NodeInfo, papHTML } from "@html/types";

export function Render(strings: TemplateStringsArray, ...values: any[]):papHTML {
  
  let htmlStrings: string[] = [];
  const events: Record<string, [string, Function]> = {};

  for (let i=0; i<strings.length; i++) {
    let text = strings[i];
    let value = values[i] ?? "";

    

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

type ValueType = {
  value: string;
  type: "event"|"array"|"fragment"|"string"|"object";
}
function valueBuilder(value:any, executed = 0):ValueType {
  if (typeof value === "function")
  {
    // the function name is from the last text and up 
    const attributeMatch = text.match(/(@|on)(?<name>[^\s]+)=$/);
    if (attributeMatch == null)
    {
      if (executed >= 10)
      {
        throw new Error("[error html]: A function is being executed over and over again")
      }
      // a function that should be executed ? 
      return valueBuilder(value(), executed + 1);
    }
    else 
    {
      text = text.replace(attributeMatch[0], `data-pap-event-${i}="${i}"`);
      events[String(i)] = [attributeMatch.groups?.name ?? attributeMatch[2], value];

      value = "";
    }
  }
  else if (value instanceof Array)
  {
    // dealing with arrays 
  }
  else if (value instanceof DocumentFragment)
  {
    // dealing with fragments 
  }
  else if (value instanceof Object)
  {
    // dealing with objects 
  }
  else 
  {
    // strings 
    htmlStrings.push(text + value);
  }
}

function compile(node: Node, events: Record<string, [string, Function]>, path:string[] = [], index = 0): NodeInfo|null {

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
      // path: [...path, index]
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
