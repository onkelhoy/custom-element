import { NodeInfo, papHTML } from "./types";

export function differ (original: NodeInfo, changed: papHTML) {

  console.log('diffing', original, changed);
  
  const max = Math.max(original.children.length, changed.papDOM.length);
  for (let i=0; i<max; i++) 
  {
    const different = compareDeep(original.children[i], changed.papDOM[i]);
    if (different)
    {
      console.log(original.children[i], changed.papDOM[i]);
    }
  }
}

function compareDeep(original: NodeInfo|undefined, changed: NodeInfo|undefined) {
  if (original === undefined) return changed === undefined;
  if (changed === undefined) return false; // we know original is NOT undefined 

  const different = compare(original, changed);
  if (different) console.log('different', different)

  const max = Math.max(original.children.length, changed.children.length);
  const childStatus = new Array(max);

  for (let i=0; i<max; i++)
  {
    const status = compareDeep(original.children[i], changed.children[i]);
    if (status) console.log('childstatus', status)
    childStatus[i] = status;
  }

  return childStatus.some(status => status) && different;
}


type DiffType = "tagName"|"text"|"children"|"events"|"attributes"|false;
// high level compare 
function compare(original: NodeInfo, changed: NodeInfo):DiffType {
  if (original.tagName !== changed.tagName) return "tagName";
  if (original.text !== changed.text) return "text";
  if (original.children.length !== changed.children.length) return "children";

  if (Object.keys(original.events).length !== Object.keys(changed.events).length) return "events";
  if (Object.keys(original.attributes).length !== Object.keys(changed.attributes).length) return "attributes";

  return false;
}