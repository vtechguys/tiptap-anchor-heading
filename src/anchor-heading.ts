import { Node } from "@tiptap/core";
import Heading from "@tiptap/extension-heading";
import { Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { v4 as uuidv4 } from "uuid";

export interface AnchorHeadingOptions {
  levels?: number[];
  onUpdate?: (anchors: string[]) => void;
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

export const AnchorHeading = Heading.extend<AnchorHeadingOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      onUpdate: () => {},
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      anchor: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-anchor"),
        renderHTML: (attributes) => {
          if (!attributes.anchor) {
            return {};
          }
          return {
            "data-anchor": attributes.anchor,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      focusAnchor:
        (anchor) =>
        ({ state, dispatch, view }) => {
          const { doc } = state;
          let pos: number | null = null;
          doc.descendants((node, position) => {
            if (node.type.name === this.name && node.attrs.anchor === anchor) {
              pos = position + 1;
              return false; // Stop iteration
            }
          });
          if (pos !== null) {
            view.focus();
            view.dispatch(
              state.tr
                .setSelection(TextSelection.create(state.doc, pos))
                .scrollIntoView()
            );

            return true;
          }
          return false;
        },
    };
  },

  addProseMirrorPlugins() {
    let previousAnchors: string[] = [];
    return [
      // Plugin to auto-generate unique anchors
      new Plugin({
        key: new PluginKey("autoOutlinePlugin"),
        appendTransaction: (transactions, oldState, newState) => {
          let tr = newState.tr;
          let modified = false;
          const anchorsSeen = new Set<string>();

          newState.doc.descendants((node, pos) => {
            if (node.type.name === this.name) {
              let anchor = node.attrs.anchor;
              if (!anchor || anchorsSeen.has(anchor)) {
                // If no anchor or duplicate anchor, generate a new one
                anchor = uuidv4();
                tr = tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  anchor,
                });
                modified = true;
              }
              anchorsSeen.add(anchor);
            }
          });

          if (modified) {
            return tr;
          }
        },
      }),
      // Plugin to handle anchor updates
      new Plugin({
        key: new PluginKey("outlineUpdatePlugin"),
        view: () => {
          return {
            update: (view, prevState) => {
              const { state } = view;
              if (prevState.doc.eq(state.doc)) {
                return;
              }
              const anchors: string[] = [];
              state.doc.descendants((node) => {
                if (node.type.name === this.name && node.attrs.anchor) {
                  anchors.push(node.attrs.anchor);
                }
              });
              if (JSON.stringify(anchors) !== JSON.stringify(previousAnchors)) {
                previousAnchors = anchors;
                if (this.options.onUpdate) {
                  this.options.onUpdate(anchors);
                }
              }
            },
          };
        },
      }),
    ];
  },
});
