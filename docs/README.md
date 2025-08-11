# @papit/core — Documentation

Welcome to the official documentation for **@papit/core** — a lightweight toolkit for building modern, reactive, and ergonomic web components.

The documentation is organized into focused sections so you can quickly find what you need.

---

## 📚 Sections

### 1. [Getting Started](./getting-started.md)
A quick introduction to installing, importing, and using `@papit/core` in your project.

### 2. [Decorators](./decorators/README.md)
Enhance your classes with powerful decorators:

- [@property](./decorators/property.md) — Reactive property definitions synced with attributes.
- [@query](./decorators/query.md) — Automatically grab DOM references after render.
- [@debounce](./decorators/debounce.md) — Delay method execution to limit high-frequency triggers.
- [@bind](./decorators/bind.md) — Preserve the correct `this` context for methods.

### 3. [HTML Rendering](./html/README.md)
Write declarative HTML templates with dynamic bindings and efficient updates.

### 4. [Functions](./functions/README.md)
Standalone utilities for general use:

- [debounceFn](./functions/debounceFn.md) — A pure, reusable debouncing function.

---

## 🔍 Advanced Topics

For deeper insights into the internal architecture and performance considerations, see:

- [Advanced Concepts](./advanced.md) — Covers rendering internals, template parts, update cycles, and how decorators hook into the component lifecycle.
- [Custom Elements](./custom-element.md) — How `@papit/core`’s base class extends native Web Components.
- [Parts API](./parts.md) — Fine-grained DOM updates with parts and dynamic bindings.

---

💡 **Tip:**  
If you’re just starting out, begin with **[Getting Started](./getting-started.md)** and then explore **[Decorators](./decorators/README.md)**.  
If you’re diving deep, head straight to **[Advanced Concepts](./advanced.md)**.
