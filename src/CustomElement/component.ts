export class CustomElement extends HTMLElement {

  static observedAttributes = [];

  private _domdiff: Record<string, string> = {}; // this keeps track of our DOM 
  // the output of html should return a papDOM or something 

  get domdiff() {
    return this._domdiff;
  }

  constructor(shadowRootInit: ShadowRootInit) {
    super();

    this.attachShadow(shadowRootInit);

    // on queryselector and all the differen element selectors we could do 
    // maybe return a proxy, and let any changes that would happen to that element 
    // make sure to call update or something ? 
    // append to the 

    // return new Proxy(this, {
    //   get: (target, name, receiver) => {

    //     switch (name) {
    //       // closest, children, firstChild, lastChild........ very big list 
    //       case "querySelectorAll":
    //         {
    //           const property = Reflect.get(this.shadowRoot || target, name, receiver);
    //           return (selector: string) => {
    //             const result = property.call(target, selector);

    //             return this._createNodeListProxy(result);
    //           }
    //         }
    //       case "getElementsById":
    //       case "querySelector":
    //         {

    //         }
    //     }

    //     return Reflect.get(target, name, receiver);
    //   }
    // });
  }

  connectedCallback() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = "<div>hello</div><p>world</p>"
    }
  }

  disconnectedCallback() {

  }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {

  }

  querySelector(selectors: string) {
    const element = this.shadowRoot?.querySelector(selectors);
    return this._createElementProxy(element);
  }

  render() {
    return `
      <div>hello</div>
    `
  }


  // PROXIES 

  /**
   * Creates a proxy for a single DOM element
   */
  private _createElementProxy(element: Element | null | undefined): Element | null {
    if (!element) return null;

    return new Proxy(element, {
      set: (target, property, value, receiver) => {
        console.log(`Element property "${String(property)}" changed to:`, value);

        // Track changes in _domdiff
        // this._domdiff[target.id || target.tagName] = {
        //   ...this._domdiff[target.id || target.tagName],
        //   [property]: value,
        // };

        // Update the actual element
        Reflect.set(target, property, value, element);

        // Trigger a re-render or update logic
        this._handleElementUpdate(target);

        return true;
      },
    });
  }

  /**
   * Creates a proxy for a NodeList of elements
   */
  private _createNodeListProxy(nodeList: NodeList): NodeList {
    const handler = {
      get: (target: NodeList, property: string | symbol, receiver: any) => {
        const value = Reflect.get(target, property, receiver);

        if (typeof value === "function") {
          // If it's a function (e.g., forEach), bind it to the original NodeList
          return value.bind(target);
        } else if (!isNaN(Number(property))) {
          // If it's an index access (e.g., nodeList[0]), proxy the element
          return this._createElementProxy(Reflect.get(target, property));
        }

        return value;
      },
    };

    return new Proxy(nodeList, handler);
  }

  /**
   * Handles updates to an element (e.g., re-rendering or diffing)
   */
  private _handleElementUpdate(element: Element) {
    console.log("Element updated:", element);
    // Add your custom logic here, e.g., re-render or update the DOM
  }
}
