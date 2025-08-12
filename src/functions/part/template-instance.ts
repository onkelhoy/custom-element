import { getDescriptors } from '@functions/part/descriptors';
import type { Part, PartFactory, PartHelpers, ITemplateInstance, PartDescriptor } from '@functions/part/types';


type Meta = {
  descriptor: PartDescriptor;
  part: Part;
}
/**
 * Represents one instance of a rendered template (DOM tree + dynamic parts).
 * Can update its parts efficiently without re-rendering the entire DOM.
 */
export class TemplateInstance implements ITemplateInstance {
  private parts: Part[];
  private indexList: number[];

  constructor(
    private root: Element,
    private partFactory: PartFactory,
  ) {
    const descriptors = getDescriptors(root);

    const helpers: PartHelpers = {
      createPart: desc => this.partFactory(desc, helpers),
      createTemplateInstance: (el) => new TemplateInstance(el, this.partFactory),
    };

    let attributes:number[] = [];
    let rest:number[] = [];

    this.parts = descriptors.map((descriptor, index) => {
      if (["attr", "event"].includes(descriptor.kind))
        attributes.push(index);
      else 
        rest.push(index);

      return this.partFactory(descriptor, helpers);
    });

    this.indexList = [...attributes, ...rest];
  }

  update(values: any[]) {
    for (const i of this.indexList) 
    {
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