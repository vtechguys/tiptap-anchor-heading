import { Node } from "@tiptap/core";
export interface AnchorHeadingOptions {
  levels?: number[];
  onAnchorUpdate?: (anchors: string[]) => void;
}
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    anchorHeading: {
      /**
       * Focus on a heading by its anchor.
       */
      focusAnchor: (anchor: string) => ReturnType;
    };
  }
}
export declare const AnchorHeading: Node<AnchorHeadingOptions, any>;
