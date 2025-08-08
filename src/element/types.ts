import { Part } from "@html";

export type Setting = {
  requestUpdateTimeout: number;
}

export type Meta = {
  element: Element,
  parts: Part[],
  values: any[],
}