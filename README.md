# @papit/core

[![Github Repo](https://img.shields.io/badge/Git-@papit/core-blue?logo=github\&link=https://github.com/onkelhoy/web-components/tree/main/packages/core)](https://github.com/onkelhoy/web-components/tree/main/packages/core)
![Layer Type](https://img.shields.io/badge/Layer_Type-core-orange)

[![Tests](https://github.com/onkelhoy/web-components/actions/workflows/pull-request.yml/badge.svg)](https://github.com/onkelhoy/web-components/actions/workflows/pull-request.yml)
[![NPM version](https://img.shields.io/npm/v/@papit/core.svg?logo=npm)](https://www.npmjs.com/package/@papit/core)

---

## Overview

**`@papit/core`** is the foundation for building reactive, declarative web components using efficient template rendering and decorator-based APIs.
It’s designed to be minimal, fast, and framework-agnostic — ideal for both standalone usage and integration into frameworks like React.

---

## Installation

```bash
npm install @papit/core
```

---

## Usage

### In plain HTML

```html
<script type="module" defer>
  import "@papit/core";
</script>

<my-element></my-element>
```

### In React

```jsx
import { MyElement } from "@papit/core/react";

function Component() {
  return <MyElement />;
}
```

---

## Development Workflow

Development takes place inside the `src` folder.

### Adding a new subcomponent

```bash
npm run component:add
```

This will:

* Update `.env`
* Create a view folder
* Create the corresponding folder under `src/components`
* Generate starter files

---

## Styling

* Edit styles in `style.scss`
* Styles are automatically compiled into `style.ts` for component consumption

---

## Live Preview

To preview during development:

```bash
npm start
```

This launches a demo server from the `views` folder.

---

## Assets

* **Component assets** (icons, translations, etc.) → store in `assets/`
* **Demo-only assets** → store in `views/<demo>/public/`

---

## Available Commands

| Command     | Description                                                                        |
| ----------- | ---------------------------------------------------------------------------------- |
| **build**   | Builds the component. Add `--prod` for minification.                               |
| **watch**   | Watches for file changes and rebuilds.                                             |
| **start**   | Starts the demo server for a specific view.                                        |
| **analyse** | Generates an analysis file (with `--verbose` and/or `--force` flags).              |
| **react**   | Generates React wrappers for components (with `--verbose` and/or `--force` flags). |

---

## Acknowledgements

Special thanks to my loving wife **Phuong** — your support and patience make all the difference. 💛

---

If you’d like, I can also add a **"Quick Start"** code example showing a minimal `CustomElement` subclass in action, so that users immediately see how `@papit/core` works. That would make the README much more inviting for first-time visitors. Would you like me to add that?
