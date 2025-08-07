import { debounceFn, STANDARD_DELAY } from "@functions/debounce";
import { Options } from "./types";


export function Decorator(): MethodDecorator;
export function Decorator(delay: number): MethodDecorator;
export function Decorator(name: string): MethodDecorator;
export function Decorator(options: Partial<Options>): MethodDecorator;
export function Decorator(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
): void;
export function Decorator(
  ...args:
    | [any, string | symbol, PropertyDescriptor]
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
    key: string | symbol,
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
  key: string | symbol,
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