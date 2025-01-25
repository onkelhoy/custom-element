export type PapElement = {
  tagName: string;
  attributes: Record<string, string>;
  events: Record<string, Function>;
  children: PapElement[];
  text: string|null;
}

export type papHTML = {
  dom: Document;
  papDOM: PapElement[];
}