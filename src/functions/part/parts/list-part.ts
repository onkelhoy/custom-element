import type { Part, PartHelpers } from "@functions/part/types";

type Key = string | number;

interface KeyEntry {
  part: Part;
  value: any;
}

/**
 * Manages a dynamic keyed list anchored before `marker`.
 * - Reuses parts by key (data-level `item.key` or element `key` attribute / __manualKey).
 * - Moves existing parts into correct order when needed.
 * - Detects attribute-based keys after creating a new part (so `key=${...}` in templates works).
 */
export class ListPart {
  private keyMap: Map<Key, KeyEntry> = new Map();

  constructor(
    private marker: Comment, 
    private helpers: PartHelpers,
  ) {}

  apply(newValue: any[]) {
    if (!Array.isArray(newValue)) {
      this.clear();
      return;
    }

    const newKeyMap = new Map<Key, KeyEntry>();

    // Iterate new items once
    for (let index = 0; index < newValue.length; index++) {
      const item = newValue[index];

      // Get key if any, else fallback to index
      const key = this.getKey(item, index);

      let entry = this.keyMap.get(key);

      if (entry) {
        // Reuse old part
        if (entry.value !== item) {
          entry.part.apply(item, entry.value);
          entry.value = item;
        }
        newKeyMap.set(key, entry);
        this.keyMap.delete(key);
      } else {
        // Create new part
        const comment = document.createComment("item-marker");
        this.marker.parentNode?.insertBefore(comment, this.marker);

        const part = this.createItemPart(comment);
        part.apply(item);

        newKeyMap.set(key, { part, value: item });
      }
    }

    // Remove leftovers (no longer present in new list)
    for (const leftover of this.keyMap.values()) {
      leftover.part.remove();
    }

    // Replace old keyMap with new one
    this.keyMap = newKeyMap;
  }

  private createItemPart(marker: Comment): Part {
    return this.helpers.createPart({ kind: "value", marker });
  }

  private getKey(value: any, index: number) {
    if (value.key) return value.key;    
    if (value instanceof Element)
    {
      const attrValue = value.getAttribute("key");
      if (attrValue && attrValue !== "<!--marker-->") return attrValue;
    }

    return index;
  }

  clear() {
    for (const entry of this.keyMap.values()) {
      entry.part.remove();
    }
    this.keyMap.clear();
  }


  remove() {
    this.clear();
    this.marker.parentNode?.removeChild(this.marker);
  }
}


// import type { Part, PartHelpers } from "@functions/part/types";

// type Key = string | number;

// interface KeyEntry {
//   part: Part;
//   value: any;
// }

// export class ListPart {
//   private keyMap: Map<Key, KeyEntry> = new Map();

//   constructor(
//     private marker: Comment, 
//     private helpers: PartHelpers,
//   ) {}

//   apply(newValue: any[]) {
//     if (!Array.isArray(newValue)) {
//       this.clear();
//       return;
//     }

//     const newKeyMap = new Map<Key, KeyEntry>();

//     // Iterate new items once
//     for (let index = 0; index < newValue.length; index++) {
//       const item = newValue[index];

//       // Get key if any, else fallback to index
//       const key: Key = (item && item.key) ?? index;

//       let entry = this.keyMap.get(key);

//       if (entry) {
//         // Reuse old part
//         if (entry.value !== item) {
//           entry.part.apply(item, entry.value);
//           entry.value = item;
//         }
//         newKeyMap.set(key, entry);
//         this.keyMap.delete(key);
//       } else {
//         // Create new part
//         const comment = document.createComment("item-marker");
//         this.marker.parentNode?.insertBefore(comment, this.marker);

//         const part = this.createItemPart(comment);
//         part.apply(item);

//         newKeyMap.set(key, { part, value: item });
//       }
//     }

//     // Remove leftovers (no longer present in new list)
//     for (const leftover of this.keyMap.values()) {
//       leftover.part.remove();
//     }

//     // Replace old keyMap with new one
//     this.keyMap = newKeyMap;
//   }

//   private createItemPart(marker: Comment): Part {
//     return this.helpers.createPart({ kind: "value", marker });
//   }

//   clear() {
//     for (const entry of this.keyMap.values()) {
//       entry.part.remove();
//     }
//     this.keyMap.clear();
//   }


//   remove() {
//     this.clear();
//     this.marker.parentNode?.removeChild(this.marker);
//   }
// }


// import type { Part, PartHelpers } from "@functions/part/types";

// /**
//  * Manages a dynamic keyed list anchored before `marker`.
//  * - Reuses parts by key (data-level `item.key` or element `key` attribute / __manualKey).
//  * - Moves existing parts into correct order when needed.
//  * - Detects attribute-based keys after creating a new part (so `key=${...}` in templates works).
//  */
// export class ListPart implements Part {
//   private keyMap: Map<string, { part: Part; value: any }> = new Map();

//   constructor(
//     private marker: Comment,
//     private helpers: PartHelpers
//   ) {}

//   apply(newValue: any) {
//     if (!Array.isArray(newValue)) {
//       this.clear();
//       return;
//     }

//     const anchor = this.marker; // insert before this for ordered items
//     const newParts: Part[] = [];
//     const newVals: any[] = [];

//     // Iterate items in order
//     for (let i = 0; i < newValue.length; i++) {
//       const item = newValue[i];

//       // 1) Prefer explicit data key
//       const explicitKey = this.extractKeyFromData(item);
//       if (explicitKey != null) {
//         const keyStr = String(explicitKey);
//         const existing = this.keyMap.get(keyStr);
//         if (existing) {
//           // reuse
//           this.keyMap.delete(keyStr);
//           this.movePartMarkerTo(existing.part, anchor);
//           existing.part.apply(item, existing.value);
//           existing.value = item;
//           newParts.push(existing.part);
//           newVals.push(item);
//           continue;
//         }

//         // no existing → create new part and map to explicit key
//         const created = this.createAndApplyPart(item, anchor);
//         newParts.push(created.part);
//         newVals.push(item);
//         // store under explicit key (even if element attr also contains key)
//         this.keyMap.delete(keyStr); // ensure no duplicate
//         this.keyMap.set(keyStr, { part: created.part, value: item });
//         continue;
//       }

//       // 2) No explicit data key → try to find by element key among existing keyMap
//       // Not trivial: we check existing map for matches first by scanning possible keys.
//       // But faster approach: try reuse by "next available" indexless entry: attempt to reuse
//       // some unclaimed part in keyMap if one matches an element-key after creation.
//       // So: create a new part, then see if it has an applied key that matches an old entry.

//       const created = this.createAndApplyPart(item, anchor);

//       // After applying the new part, we can read the applied element key (if any)
//       const appliedKey = this.getKeyFromPart(created.part);
//       if (appliedKey != null && this.keyMap.has(String(appliedKey))) {
//         // there was an old part that has this key — prefer the old part (reuse)
//         const old = this.keyMap.get(String(appliedKey))!;
//         this.keyMap.delete(String(appliedKey));

//         // remove the just-created part (clean up) and reuse the old one
//         created.part.remove();

//         // move old marker into place and apply with new item
//         this.movePartMarkerTo(old.part, anchor);
//         old.part.apply(item, old.value);
//         old.value = item;
//         newParts.push(old.part);
//         newVals.push(item);
//       } else {
//         // no matching old keyed entry — keep the newly created part
//         newParts.push(created.part);
//         newVals.push(item);

//         // if created part has an appliedKey, store it for future reuse
//         if (appliedKey != null) {
//           this.keyMap.set(String(appliedKey), { part: created.part, value: item });
//         } else {
//           // fallback: store under synthetic index key so it can be removed later if unused
//           this.keyMap.set(`__idx_${i}`, { part: created.part, value: item });
//         }
//       }
//     }

//     // Remove leftover old parts (not reused)
//     for (const entry of this.keyMap.values()) {
//       entry.part.remove();
//     }

//     // Commit new map: rebuild from newParts (we want keys stable for next updates)
//     const rebuilt = new Map<string, { part: Part; value: any }>();
//     for (let i = 0; i < newParts.length; i++) {
//       const p = newParts[i];
//       const val = newVals[i];
//       const k = this.getKeyFromPart(p) ?? (val && typeof val === 'object' && val.key != null ? String(val.key) : `__idx_${i}`);
//       rebuilt.set(String(k), { part: p, value: val });
//     }
//     this.keyMap = rebuilt;
//   }

//   /** Create a new item part anchored before anchor, apply value, return {part} */
//   private createAndApplyPart(item: any, anchor: Comment) {
//     const comment = document.createComment("item-marker");
//     anchor.parentNode?.insertBefore(comment, anchor);

//     const part = this.createItemPart(comment);
//     part.apply(item);
//     return { part };
//   }

//   /** Move the (part as any).marker node to be directly before anchor to preserve order */
//   private movePartMarkerTo(part: Part, anchor: Comment) {
//     const marker = (part as any).marker as Comment | undefined;
//     if (marker && marker.parentNode) {
//       marker.parentNode.insertBefore(marker, anchor);
//     }
//   }

//   /**
//    * Read key from a part by inspecting the live DOM (previous element before marker).
//    * Checks __manualKey then attribute "key".
//    */
//   private getKeyFromPart(part: Part): string | null {
//     const marker = (part as any).marker as Comment | undefined;
//     if (!marker) return null;
//     // previous sibling may be text; walk backwards to find element node
//     let n: Node | null = marker.previousSibling;
//     while (n && n.nodeType !== Node.ELEMENT_NODE) n = n.previousSibling;
//     if (!n) return null;
//     const el = n as Element;
//     const manual = (el as any).__manualKey;
//     if (manual != null) return String(manual);
//     const attr = el.getAttribute?.("key");
//     if (attr != null) return String(attr);
//     return null;
//   }

//   /** Extract explicit data-level key: item.key */
//   private extractKeyFromData(item: any): string | null {
//     if (item && typeof item === "object" && item.key != null) return String(item.key);
//     return null;
//   }

//   private createItemPart(marker: Comment): Part {
//     return this.helpers.createPart({
//       kind: 'value',
//       marker,
//     });
//   }

//   clear() {
//     for (const entry of this.keyMap.values()) {
//       entry.part.clear();
//     }
//     this.keyMap.clear();

//     // Remove nodes between marker and its previous marker (cleanup)
//     let node = this.marker.previousSibling;
//     while (node && !(node instanceof Comment && node === this.marker)) {
//       const prev = node.previousSibling;
//       node.parentNode?.removeChild(node);
//       node = prev;
//     }
//   }

//   remove() {
//     this.clear();
//     this.marker.parentNode?.removeChild(this.marker);
//   }
// }


// // // parts/list-part.ts
// // import type { Part, PartHelpers } from "@functions/part/types";
// // import { getValues } from "@html/html";
// // import { getDescriptors } from "@functions/part/descriptors";

// // /**
// //  * Manages a dynamic list of parts anchored before a marker.
// //  * Uses keyed diffing for minimal DOM changes. If an item is a nested
// //  * template (Element returned by `html(...)`) this will attempt to
// //  * extract the `key` from the nested template's values (via getDescriptors/getValues)
// //  * before falling back to element attribute or index.
// //  */
// // export class ListPart implements Part {
// //   private itemParts: Part[] = [];
// //   private itemValues: any[] = [];

// //   constructor(
// //     private marker: Comment,
// //     private helpers: PartHelpers
// //   ) {}

// //   apply(newValue: any) {
// //     if (!Array.isArray(newValue)) {
// //       this.clear();
// //       return;
// //     }

// //     // Build map of old keys -> old part (one pass)
// //     const oldKeyMap = new Map<string, { part: Part; value: any }>();
// //     for (let i = 0; i < this.itemParts.length; i++) {
// //       const k = this.computeKey(this.itemValues[i], this.itemParts[i], i);
// //       oldKeyMap.set(String(k), { part: this.itemParts[i], value: this.itemValues[i] });
// //     }

// //     const newParts: Part[] = [];
// //     const newVals: any[] = [];

// //     // Iterate the new array and reuse/create parts
// //     for (let i = 0; i < newValue.length; i++) {
// //       const item = newValue[i];

// //       // compute stable key for this item (prefixed to avoid collisions)
// //       const rawKey = this.computeKey(item, undefined, i);
// //       const key = typeof rawKey === "string" ? `k:${rawKey}` : `i:${String(rawKey)}`;

// //       let part: Part | undefined = undefined;

// //       if (oldKeyMap.has(key)) {
// //         // reuse old part
// //         const entry = oldKeyMap.get(key)!;
// //         oldKeyMap.delete(key);
// //         part = entry.part;

// //         // make sure the part's anchor (comment marker) is moved to correct place
// //         const partMarker = (part as any).marker as Comment | undefined;
// //         if (partMarker && partMarker.parentNode) {
// //           // Insert the marker before the main marker in-order, preserving DOM order
// //           partMarker.parentNode.insertBefore(partMarker, this.marker);
// //         }

// //         // apply new value with oldValue so part implementations can diff
// //         part.apply(item, entry.value);
// //       } else {
// //         // create new part (insert anchor then create part)
// //         const comment = document.createComment("item-marker");
// //         this.marker.parentNode?.insertBefore(comment, this.marker);

// //         part = this.createItemPart(comment);
// //         part.apply(item);
// //       }

// //       newParts.push(part);
// //       newVals.push(item);
// //     }

// //     // Remove leftover old parts that weren't reused
// //     for (const { part } of oldKeyMap.values()) {
// //       // .remove() should clear DOM anchors + content
// //       if (typeof (part as any).remove === "function") (part as any).remove();
// //       else part.clear();
// //     }

// //     // Commit new state
// //     this.itemParts = newParts;
// //     this.itemValues = newVals;
// //   }

// //   /**
// //    * Compute a stable key for an item:
// //    * 1) if item is a plain object and has `key` property -> use that
// //    * 2) if item is an Element produced by html() -> try:
// //    *    a) item.__manualKey
// //    *    b) nested template values -> search nested descriptors for attr 'key' and read its value
// //    *    c) element.getAttribute('key')
// //    * 3) if a Part is provided, try to derive key from the part's DOM node (previous sibling)
// //    * 4) fallback to index
// //    */
// //   private computeKey(item: any, maybePart?: Part, index?: number): string | number {
// //     // 1) explicit object-level key
// //     if (item && typeof item === "object" && "key" in item && item.key != null) {
// //       return item.key;
// //     }

// //     // 2) element-level keys (nested templates)
// //     if (item instanceof Element) {
// //       // a) __manualKey set earlier by AttributePart
// //       const manual = (item as any).__manualKey;
// //       if (manual != null) return manual;

// //       // b) nested template values via getValues + getDescriptors
// //       const nestedValues = getValues(item);
// //       if (nestedValues) {
// //         const nestedDescriptors = getDescriptors(item);
// //         // find index of attribute descriptor named "key"
// //         let idx = -1;
// //         for (let i = 0, di = 0; i < nestedDescriptors.length; i++) {
// //           const d = nestedDescriptors[i];
// //           // descriptors array is in the same order as values
// //           if (d.kind === "attr" && (d as any).name === "key") {
// //             idx = i;
// //             break;
// //           }
// //         }
// //         if (idx !== -1 && nestedValues[idx] != null) {
// //           return nestedValues[idx];
// //         }
// //       }

// //       // c) fallback to attribute
// //       const attr = item.getAttribute && item.getAttribute("key");
// //       if (attr != null) return attr;
// //     }

// //     // 3) derive from part DOM (if provided)
// //     if (maybePart) {
// //       const marker = (maybePart as any).marker as Comment | undefined;
// //       if (marker) {
// //         // the inserted content is usually before the marker; find nearest element
// //         let n: Node | null = marker.previousSibling;
// //         while (n && n.nodeType !== Node.ELEMENT_NODE) n = n.previousSibling;
// //         if (n instanceof Element) {
// //           const k = (n as any).__manualKey ?? n.getAttribute?.("key");
// //           if (k != null) return k;
// //         }
// //       }
// //     }

// //     // 4) fallback index
// //     return index ?? 0;
// //   }

// //   private createItemPart(marker: Comment): Part {
// //     return this.helpers.createPart({ kind: "value", marker });
// //   }

// //   clear() {
// //     for (const p of this.itemParts) p.clear();
// //     this.itemParts = [];
// //     this.itemValues = [];
// //     // remove nodes between marker and previous sibling cluster (if you used that convention)
// //     let node = this.marker.previousSibling;
// //     while (node && !(node instanceof Comment && node === this.marker)) {
// //       const prev = node.previousSibling;
// //       node.parentNode?.removeChild(node);
// //       node = prev;
// //     }
// //   }

// //   remove() {
// //     this.clear();
// //     this.marker.parentNode?.removeChild(this.marker);
// //   }
// // }


// // // import type { Part, PartHelpers } from "@functions/part/types";

// // // /**
// // //  * Manages a dynamic list of parts anchored before a marker.
// // //  * Creates, updates, and removes item parts as the bound array changes.
// // //  */
// // // export class ListPart implements Part {
// // //   private itemParts: Part[] = [];
// // //   private itemValues: any[] = [];

// // //   constructor(
// // //     private marker: Comment,
// // //     private helpers: PartHelpers
// // //   ) {}

// // //   // apply(newValue: any) {
// // //   //   if (!Array.isArray(newValue)) {
// // //   //     this.clear();
// // //   //     return;
// // //   //   }

// // //   //   const oldLength = this.itemParts.length;
// // //   //   const newLength = newValue.length;

// // //   //   // Update or create parts for each new item
// // //   //   for (let i = 0; i < newLength; i++) {
// // //   //     const item = newValue[i];
// // //   //     const oldItemValue = this.itemValues[i];

// // //   //     if (i < oldLength) {
// // //   //       // Update existing part
// // //   //       this.itemParts[i].apply(item, oldItemValue);
// // //   //     } else {
// // //   //       // Create new ValuePart-like thing for the item
// // //   //       const comment = document.createComment("item-marker");
// // //   //       this.marker.parentNode?.insertBefore(comment, this.marker);

// // //   //       const part = this.createItemPart(comment);
// // //   //       part.apply(item);
// // //   //       this.itemParts.push(part);
// // //   //     }
// // //   //   }

// // //   //   // Remove any leftover parts if list got shorter
// // //   //   if (newLength < oldLength) {
// // //   //     for (let i = newLength; i < oldLength; i++) {
// // //   //       this.itemParts[i].remove();
// // //   //     }
// // //   //     this.itemParts.length = newLength;
// // //   //   }

// // //   //   this.itemValues = newValue.slice();
// // //   // }

// // //   // apply(newValue: any) {
// // //   //   if (!Array.isArray(newValue)) {
// // //   //     this.clear();
// // //   //     return;
// // //   //   }

// // //   //   // STEP 1 — Build old key map
// // //   //   const oldKeyMap = new Map<string, { index: number; part: Part }>();
// // //   //   for (let i = 0; i < this.itemParts.length; i++) {
// // //   //     const part = this.itemParts[i];
// // //   //     const key = this.getPartKey(part) ?? String(i);
// // //   //     console.log('KEY', key)
// // //   //     if (key != null) {
// // //   //       oldKeyMap.set(key, { index: i, part });
// // //   //     }
// // //   //   }

// // //   //   const newParts: Part[] = [];
// // //   //   const newValues: any[] = [];

// // //   //   // STEP 2 — Loop new items and reuse/create parts
// // //   //   for (let i = 0; i < newValue.length; i++) {
// // //   //     const item = newValue[i];
// // //   //     const key = this.extractKeyFromItem(item);

// // //   //     let part: Part | undefined;
// // //   //     let oldIndex: number | undefined;

// // //   //     if (key != null && oldKeyMap.has(key)) {
// // //   //       // Reuse old part with same key
// // //   //       const entry = oldKeyMap.get(key)!;
// // //   //       part = entry.part;
// // //   //       oldIndex = entry.index;
// // //   //       oldKeyMap.delete(key);
// // //   //       part.apply(item, this.itemValues[oldIndex]);
// // //   //     } else if (i < this.itemParts.length && oldKeyMap.size === 0) {
// // //   //       // Fallback: reuse same index if no keyed match
// // //   //       part = this.itemParts[i];
// // //   //       part.apply(item, this.itemValues[i]);
// // //   //     } else {
// // //   //       // Create new part
// // //   //       const comment = document.createComment("item-marker");
// // //   //       this.marker.parentNode?.insertBefore(comment, this.marker);

// // //   //       part = this.createItemPart(comment);
// // //   //       part.apply(item);
// // //   //     }

// // //   //     newParts.push(part);
// // //   //     newValues.push(item);
// // //   //   }

// // //   //   // STEP 3 — Remove leftovers from old map
// // //   //   for (const { part } of oldKeyMap.values()) {
// // //   //     part.remove();
// // //   //   }

// // //   //   // STEP 4 — Replace arrays
// // //   //   this.itemParts = newParts;
// // //   //   this.itemValues = newValues;
// // //   // }

// // //   // private getPartKey(part: Part): string | null {
// // //   //   const node = (part as any)?.marker?.nextSibling ?? null;
// // //   //   console.log('NODE', node);
// // //   //   return node?.__manualKey ?? node?.getAttribute?.("key") ?? null;
// // //   // }

// // //   // private extractKeyFromItem(item: any): string | null {
// // //   //   // If item is a DOM template binding result, key will be applied via AttributePart.
// // //   //   // If item is data object, you can customize this extraction:
// // //   //   if (item && typeof item === "object" && "key" in item) {
// // //   //     return String(item.key);
// // //   //   }
// // //   //   return null;
// // //   // }

// // // //   import type { Part, PartHelpers } from "@functions/part/types";

// // // // export class ListPart implements Part {
// // // //   private itemParts: Part[] = [];
// // // //   private itemValues: any[] = [];

// // // //   constructor(
// // // //     private marker: Comment,
// // // //     private helpers: PartHelpers
// // // //   ) {}

// // //   apply(newValue: any) {
// // //     if (!Array.isArray(newValue)) {
// // //       this.clear();
// // //       return;
// // //     }

// // //     // --- Build map of old keys to (part, value) ---
// // //     const oldKeyMap = new Map<string, { part: Part; value: any }>();
// // //     for (let i = 0; i < this.itemParts.length; i++) {
// // //       const key = this.getKey(this.itemValues[i], this.itemParts[i], i);
// // //       oldKeyMap.set(String(key), { part: this.itemParts[i], value: this.itemValues[i] });
// // //     }

// // //     const newParts: Part[] = [];
// // //     const newVals: any[] = [];

// // //     // --- Process new list ---
// // //     for (let i = 0; i < newValue.length; i++) {
// // //       const item = newValue[i];
// // //       const key = String(this.getKey(item, undefined, i));

// // //       let part: Part;

// // //       if (oldKeyMap.has(key)) {
// // //         // Reuse old part
// // //         const { part: oldPart, value: oldVal } = oldKeyMap.get(key)!;
// // //         oldKeyMap.delete(key);

// // //         // Move marker if out of place
// // //         const marker = (oldPart as any).marker as Comment;
// // //         if (marker && marker.parentNode && marker.nextSibling !== this.marker) {
// // //           marker.parentNode.insertBefore(marker, this.marker);
// // //         }

// // //         oldPart.apply(item, oldVal);
// // //         part = oldPart;
// // //       } else {
// // //         // create a new anchor and a new part
// // //         const comment = document.createComment("item-marker");
// // //         this.marker.parentNode?.insertBefore(comment, this.marker);

// // //         part = this.createItemPart(comment);
// // //         part.apply(item);
// // //       }

// // //       newParts.push(part);
// // //       newVals.push(item);
// // //     }

// // //     // --- Remove unused old parts ---
// // //     for (const { part } of oldKeyMap.values()) {
// // //       part.remove();
// // //     }

// // //     // --- Commit new state ---
// // //     this.itemParts = newParts;
// // //     this.itemValues = newVals;
// // //   }

// // //   private getKey(item: any, part?: Part, index?: number): string | number | null {
// // //     // 1) explicit object key (data-level)
// // //     if (item && typeof item === "object" && item.key != null) return item.key;

// // //     // 2) if item is an Element, try element attributes
// // //     if (item instanceof Element) {
// // //       const k = (item as any).__manualKey ?? item.getAttribute("key");
// // //       if (k != null) return k;
// // //     }

// // //     // 3) try to derive key from existing part's DOM node (fallback)
// // //     if (part) {
// // //       const marker = (part as any).marker as Comment | undefined;
// // //       if (marker) {
// // //         // inserted content is typically before the marker; walk previousSibling for the element
// // //         let n: Node | null = marker.previousSibling;
// // //         while (n && n.nodeType !== Node.ELEMENT_NODE) n = n.previousSibling;
// // //         if (n && n.nodeType === Node.ELEMENT_NODE) {
// // //           const el = n as Element;
// // //           const k = (el as any).__manualKey ?? el.getAttribute("key");
// // //           if (k != null) return k;
// // //         }
// // //       }
// // //     }

// // //     // 4) fallback to index (caller may override behavior)
// // //     return index ?? null;
// // //   }


// // //   private createItemPart(marker: Comment): Part {
// // //     // Reuse the factory to create a value part
// // //     return this.helpers.createPart({
// // //       kind: 'value',
// // //       marker,
// // //     }); 
// // //   }

// // //   clear() {
// // //     for (const part of this.itemParts) {
// // //       part.clear();
// // //     }
// // //     this.itemParts = [];
// // //     this.itemValues = [];

// // //     // Remove all nodes between marker and next marker (or end)
// // //     let node = this.marker.previousSibling;
// // //     while (node && !(node instanceof Comment && node === this.marker)) {
// // //       const prev = node.previousSibling;
// // //       node.parentNode?.removeChild(node);
// // //       node = prev;
// // //     }
// // //   }

// // //   remove() {
// // //     this.clear();
// // //     this.marker.parentNode?.removeChild(this.marker);
// // //   }
// // // }
