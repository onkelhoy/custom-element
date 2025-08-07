import { STANDARD_DELAY } from "./constants";

export function Function<T extends (...args: any[]) => any>(
  execute: T,
  delay: number = STANDARD_DELAY
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      execute.apply(this, args);
      timer = null;
    }, delay);
  };
}