import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { IframeNodeView } from "./IframeNodeView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    iframe: {
      setIframe: (attrs: { src: string; width?: string; height?: string }) => ReturnType;
      updateIframe: (attrs: { src: string; width?: string; height?: string }) => ReturnType;
      deleteIframe: () => ReturnType;
    };
  }
}

export const Iframe = Node.create({
  name: "iframe",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src:   { default: null },
      width: { default: "100%" },
      height: { default: "400" },
    };
  },

  parseHTML() {
    return [{ tag: 'iframe[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { class: "blog-embed-wrapper", contenteditable: "false" },
      [
        "iframe",
        mergeAttributes(HTMLAttributes, {
          frameborder: "0",
          allowfullscreen: "true",
          referrerpolicy: "no-referrer-when-downgrade",
        }),
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(IframeNodeView);
  },

  addCommands() {
    return {
      setIframe:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
      updateIframe:
        (attrs) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, attrs);
        },
      deleteIframe:
        () =>
        ({ commands }) => {
          return commands.deleteNode(this.name);
        },
    };
  },
});
