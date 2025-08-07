import { INITIALIZER_SYMBOL } from "@shared/symbols";
import { Setting } from "./types";

const defaultSettings: Partial<Setting> = {
  readonly: false,
  rerender: false,
};

export function Decorator(target: any, key: string): void;
export function Decorator(settings: Partial<Setting>): (target: any, key: string) => void;
export function Decorator(...args: any[]): any {
  if (args.length === 2 || args.length === 3 && args[2] === undefined) {
    // @property — no config passed
    const [target, key] = args;
    define(target, key, {}); // merge with default inside define()
  } else {
    // @property({...}) — with config
    const settings = args[0] as Partial<Setting>;
    return function (target: any, key: string) {
      define(target, key, settings);
    };
  }
}



function define(target: any, key: string, settings: Partial<Setting>) {
  const privateKey = Symbol(`__${key}`);

  Object.defineProperty(target, key, {
    configurable: settings.configurable ?? true,
    enumerable: settings.enumerable ?? true,
    get() { 
      const data = this[privateKey];
      return settings?.get ? settings.get.call(this, data) : data;
    },
    set(value) {
      if (settings.readonly && Object.hasOwn(this, privateKey))
      {
        throw new TypeError(`Cannot reassign readonly property '${key}'`);
      }

      const oldVal = this[privateKey];

      const isInitial = !Object.hasOwn(this, privateKey);

      if (settings.before) {
        settings.before.call(this, value, oldVal, isInitial);
      }
      
      this[privateKey] = value;

      if (settings.after) {
        console.log('calling after')
        settings.after.call(this, value, oldVal, isInitial);
      }

      if (!isInitial && settings.rerender && typeof this.requestUpdate === 'function') {
        this.requestUpdate();
      }
      // other logic here
    },
  });
}
