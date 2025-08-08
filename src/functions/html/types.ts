// Interface for a dynamic part (simplified)
export interface Part {
  apply(value: any, oldValue: any): void;
  clear(): void;
  compare(value: any, oldValue: any): boolean;
}