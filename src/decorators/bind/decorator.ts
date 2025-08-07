
export function Decorator(_: any, _2: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  return {
    configurable: true,
    get() {
      const boundFn = original.bind(this);
      Object.defineProperty(this, _2, {
        value: boundFn,
        configurable: true,
        writable: true
      });
      return boundFn;
    }
  };
}