import { getDescriptors } from '@functions/part/descriptors';
import type { Part, PartFactory, PartHelpers, ITemplateInstance } from '@functions/part/types';

/**
 * Represents one instance of a rendered template (DOM tree + dynamic parts).
 * Can update its parts efficiently without re-rendering the entire DOM.
 */
export class TemplateInstance implements ITemplateInstance {
  private parts: Part[];

  constructor(
    private root: Element,
    private partFactory: PartFactory,
  ) {
    const descriptors = getDescriptors(root);

    const helpers: PartHelpers = {
      createPart: desc => this.partFactory(desc, helpers),
      createTemplateInstance: (el) => new TemplateInstance(el, this.partFactory),
    };

    this.parts = descriptors.map(desc => this.partFactory(desc, helpers));
  }

  update(values: any[]) {
    for (let i = 0; i < this.parts.length; i++) {
      this.parts[i].apply(values[i]);
    }
  }

  remove() {
    this.parts.forEach(part => part.remove());
    this.root.parentNode?.removeChild(this.root);
  }

  get element() {
    return this.root;
  }
}