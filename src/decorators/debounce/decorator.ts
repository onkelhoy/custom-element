import { debounceFn, STANDARD_DELAY } from "@functions/debounce";
import { Options } from "./types";

export function debounce(): MethodDecorator;
export function debounce(delay: number): MethodDecorator;
export function debounce(name: string): MethodDecorator;
export function debounce(options: Partial<Options>): MethodDecorator;
export function debounce(
  target: any,
  propertyKey: PropertyKey,
  descriptor: PropertyDescriptor
): void;
export function debounce(
  ...args:
    | [any, PropertyKey, PropertyDescriptor]
    | [number | string | Partial<Options>]
): MethodDecorator | void {

  // CASE: @debounce

  if (args.length === 3 && typeof args[2] === "object") {
    const [target, key, descriptor] = args;
    return applyDebounce({ delay: STANDARD_DELAY }, target, key, descriptor);
  }

  // CASE: @debounce(...) (with options)
  const opts = normalizeArgs(args[0]);

  return function (
    target: any,
    key: PropertyKey,
    descriptor: PropertyDescriptor
  ): void {
    applyDebounce(opts, target, key, descriptor);
  };
}

function normalizeArgs(arg: any): Options {
  if (typeof arg === "number") return { delay: arg };
  if (typeof arg === "string") return { delay: STANDARD_DELAY, name: arg };
  return { delay: STANDARD_DELAY, ...arg };
}

// The real decorator logic
function applyDebounce(
  options: Options,
  target: any,
  key: PropertyKey,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  const debouncedFn = debounceFn(original, options.delay);

  if (options.name) {
    Object.defineProperty(target, String(options.name ?? key), {
      configurable: true,
      enumerable: false,
      writable: true,
      value: debouncedFn,
    });
  } else {
    descriptor.value = debouncedFn;
  }
}