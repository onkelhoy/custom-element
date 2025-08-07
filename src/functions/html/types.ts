// export type NodeInfo = {
//   tagName: string;
//   attributes: Record<string, string>;
//   events: Record<string, Function>;
//   children: NodeInfo[];
//   text: string|null;
// }

// export type papHTML = {
//   dom: DocumentFragment;
//   papDOM: NodeInfo[];
// }

// Interface for a dynamic part (simplified)
export interface Part {
  apply(value: any, oldValue: any): void;
}

export type Metadata = {
  parts: Part[];
  lastValues: any[];
  update(newValues: any[], initial?: boolean): void;
}