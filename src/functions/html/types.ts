export type NodeInfo = {
  tagName: string;
  attributes: Record<string, string>;
  events: Record<string, Function>;
  children: NodeInfo[];
  text: string|null;
}

export type papHTML = {
  dom: DocumentFragment;
  papDOM: NodeInfo[];
}