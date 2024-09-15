'use strict';

var Heading = require('@tiptap/extension-heading');
var prosemirrorState = require('prosemirror-state');
var uuid = require('uuid');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

var Heading__default = /*#__PURE__*/_interopDefaultCompat(Heading);

const AnchorHeading = Heading__default.default.extend({
    addOptions() {
        var _a;
        return {
            ...(_a = this.parent) === null || _a === void 0 ? void 0 : _a.call(this),
            onUpdate: () => { },
        };
    },
    addAttributes() {
        var _a;
        return {
            ...(_a = this.parent) === null || _a === void 0 ? void 0 : _a.call(this),
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
        var _a;
        return {
            ...(_a = this.parent) === null || _a === void 0 ? void 0 : _a.call(this),
            focusAnchor: (anchor) => ({ state, dispatch, view }) => {
                const { doc } = state;
                let pos = null;
                doc.descendants((node, position) => {
                    if (node.type.name === this.name && node.attrs.anchor === anchor) {
                        pos = position + 1;
                        return false; // Stop iteration
                    }
                });
                if (pos !== null) {
                    view.focus();
                    view.dispatch(state.tr.setSelection(prosemirrorState.TextSelection.create(state.doc, pos)).scrollIntoView());
                    return true;
                }
                return false;
            },
        };
    },
    addProseMirrorPlugins() {
        let previousAnchors = [];
        return [
            // Plugin to auto-generate unique anchors
            new prosemirrorState.Plugin({
                key: new prosemirrorState.PluginKey("autoOutlinePlugin"),
                appendTransaction: (transactions, oldState, newState) => {
                    let tr = newState.tr;
                    let modified = false;
                    const anchorsSeen = new Set();
                    newState.doc.descendants((node, pos) => {
                        if (node.type.name === this.name) {
                            let anchor = node.attrs.anchor;
                            if (!anchor || anchorsSeen.has(anchor)) {
                                // If no anchor or duplicate anchor, generate a new one
                                anchor = uuid.v4();
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
            new prosemirrorState.Plugin({
                key: new prosemirrorState.PluginKey("outlineUpdatePlugin"),
                view: () => {
                    return {
                        update: (view, prevState) => {
                            const { state } = view;
                            if (prevState.doc.eq(state.doc)) {
                                return;
                            }
                            const anchors = [];
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

exports.AnchorHeading = AnchorHeading;
//# sourceMappingURL=index.cjs.map
