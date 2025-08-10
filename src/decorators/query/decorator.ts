import { CustomElement } from "@element/custom-element";
import { Setting } from "./types";
import { QueryMeta } from "@element/types";

export function query<T extends Element = HTMLElement>(settings: string | Partial<Setting<T>>): PropertyDecorator;
export function query(target: Object, propertyKey: PropertyKey): void;

export function query<T extends Element = HTMLElement>(
  targetOrSettings: Object | string | Partial<Setting<T>>,
  propertyKey?: PropertyKey
): void | PropertyDecorator {
  // @query — no args
  if (propertyKey) {
    define<T>(targetOrSettings as Object, propertyKey, {});
    return; // void → valid for this overload
  }

  // @query({...}) — with config
  const settings: Partial<Setting<T>> =
    typeof targetOrSettings === "string"
      ? { selector: targetOrSettings }
      : (targetOrSettings as Partial<Setting<T>>);

  return function (target: Object, key: PropertyKey) {
    define<T>(
      target, 
      key, 
      settings,
    );
  };
}

function define<T extends Element = HTMLElement>(target: any, propertyKey: PropertyKey, settings: Partial<Setting<T>>): void {
  const selector = String(settings.selector ?? propertyKey);
  
  // Always store on target
  const meta: QueryMeta[] = target.queryMeta ??= [];
  meta.push({ selector, load: settings.load, propertyKey });
}