export function bind<T>(
  target: Object,
  propertyKey: PropertyKey,
  descriptor: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> {
  const original = descriptor.value as unknown as Function;
  return {
    configurable: true,
    get() {
      const boundFn = original.bind(this);
      Object.defineProperty(this, propertyKey, {
        value: boundFn,
        configurable: true,
        writable: true
      });
      return boundFn;
    }
  } as TypedPropertyDescriptor<T>;
}
