import type { Element } from 'hast';

// A minimal HAST node type; extend as needed
export type HastNode = Element | {
  type: string;
  value?: string;
  children?: HastNode[];
  [key: string]: any;
};