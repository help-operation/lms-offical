"use client";

import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Iframe } from "./tiptap/iframe-extension";
import { EmbedDialog } from "./tiptap/EmbedDialog";
import { MediaLibraryModal } from "@/features/media/components/MediaLibraryModal";
import {
  Bold, Italic, UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Minus, Link2, Link2Off, Undo, Redo,
  ImageIcon, MonitorPlay, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ChevronDown, Type, Palette, Highlighter,
} from "lucide-react";

const FONTS = [
  { label: "Default", value: "" },
  { label: "Inter", value: "Inter" },
  { label: "Poppins", value: "Poppins" },
  { label: "Roboto", value: "Roboto" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Lato", value: "Lato" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Nunito", value: "Nunito" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Merriweather", value: "Merriweather" },
  { label: "Noto Sans Bengali", value: "Noto Sans Bengali" },
  { label: "Hind Siliguri", value: "Hind Siliguri" },
  { label: "Noto Sans Arabic", value: "Noto Sans Arabic" },
  { label: "Amiri", value: "Amiri" },
  { label: "Cairo", value: "Cairo" },
  { label: "Tajawal", value: "Tajawal" },
  { label: "Noto Sans Devanagari", value: "Noto Sans Devanagari" },
  { label: "Noto Sans Tamil", value: "Noto Sans Tamil" },
  { label: "Courier New", value: "Courier New" },
  { label: "Monospace", value: "monospace" },
];

const FONT_CSS_MAP: Record<string, string> = {
  Inter: "'Inter', sans-serif",
  Poppins: "'Poppins', sans-serif",
  Roboto: "'Roboto', sans-serif",
  "Open Sans": "'Open Sans', sans-serif",
  Lato: "'Lato', sans-serif",
  Montserrat: "'Montserrat', sans-serif",
  Nunito: "'Nunito', sans-serif",
  "Playfair Display": "'Playfair Display', serif",
  Merriweather: "'Merriweather', serif",
  "Noto Sans Bengali": "'Noto Sans Bengali', sans-serif",
  "Hind Siliguri": "'Hind Siliguri', sans-serif",
  "Noto Sans Arabic": "'Noto Sans Arabic', sans-serif",
  Amiri: "'Amiri', serif",
  Cairo: "'Cairo', sans-serif",
  Tajawal: "'Tajawal', sans-serif",
  "Noto Sans Devanagari": "'Noto Sans Devanagari', sans-serif",
  "Noto Sans Tamil": "'Noto Sans Tamil', sans-serif",
  "Courier New": "'Courier New', monospace",
  monospace: "monospace",
};

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@400;600;700&family=Roboto:wght@400;600;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;600;700&family=Nunito:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Noto+Sans+Bengali:wght@400;600;700&family=Hind+Siliguri:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;600;700&family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Tamil:wght@400;600;700&display=swap";

const PRESET_COLORS = [
  "#000000", "#424242", "#616161", "#9E9E9E", "#BDBDBD", "#E0E0E0", "#F5F5F5", "#FFFFFF",
  "#F44336", "#E91E63", "#9C27B0", "#673AB7",
  "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4",
  "#009688", "#4CAF50", "#8BC34A", "#CDDC39",
  "#FFC107", "#FF9800", "#FF5722", "#795548",
  "#0D47A1", "#1565C0", "#1E88E5", "#42A5F5",
  "#1B5E20", "#2E7D32", "#43A047", "#66BB6A",
  "#E65100", "#EF6C00", "#F57C00", "#FFB74D",
  "#B71C1C", "#880E4F", "#4A148C", "#311B92",
];

const GOOGLE_LANGUAGES: { label: string; subset: string }[] = [
  { label: "Bengali", subset: "bengali" },
  { label: "Arabic", subset: "arabic" },
  { label: "Hindi", subset: "devanagari" },
  { label: "Tamil", subset: "tamil" },
  { label: "Thai", subset: "thai" },
  { label: "Korean", subset: "korean" },
  { label: "Japanese", subset: "japanese" },
  { label: "Chinese (Simplified)", subset: "chinese-simplified" },
];

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
  className,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors disabled:opacity-40
        ${active
          ? "bg-brand-100 text-brand-700"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-gray-200" />;
}

function FontSelect({ editor }: { editor: any }) {
  const [open, setOpen] = useState(false);
  const currentFont = editor.getAttributes("textStyle").fontFamily || "";

  function setFont(font: string) {
    if (font) {
      editor.chain().focus().setFontFamily(font).run();
    } else {
      editor.chain().focus().unsetFontFamily().run();
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen(!open); }}
        title="Font family"
        className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors max-w-[120px]"
      >
        <Type className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{currentFont || "Default"}</span>
        <ChevronDown className="h-3 w-3 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-52 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            {FONTS.map((f) => (
              <button
                key={f.value}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setFont(f.value); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  currentFont === f.value ? "bg-brand-50 text-brand-700 font-semibold" : "text-gray-700"
                }`}
                style={{ fontFamily: FONT_CSS_MAP[f.value] || "inherit" }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AlignBtn({
  editor,
  align,
  title,
}: {
  editor: any;
  align: "left" | "center" | "right" | "justify";
  title: string;
}) {
  const icons: Record<string, React.ReactNode> = {
    left: <AlignLeft className="h-3.5 w-3.5" />,
    center: <AlignCenter className="h-3.5 w-3.5" />,
    right: <AlignRight className="h-3.5 w-3.5" />,
    justify: <AlignJustify className="h-3.5 w-3.5" />,
  };

  return (
    <ToolbarBtn
      onClick={() => editor.chain().focus().setTextAlign(align).run()}
      active={editor.isActive({ textAlign: align })}
      title={title}
    >
      {icons[align]}
    </ToolbarBtn>
  );
}

function ColorPicker({
  icon,
  title,
  currentColor,
  onChangeColor,
  onClear,
}: {
  icon: React.ReactNode;
  title: string;
  currentColor: string;
  onChangeColor: (color: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(currentColor || "#000000");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen(!open); }}
        title={title}
        className="flex h-8 w-8 flex-col items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
      >
        {icon}
        <div
          className="mt-0.5 h-1 w-4 rounded-full"
          style={{ backgroundColor: currentColor || "transparent" }}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
            <div className="mb-2 grid grid-cols-8 gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onChangeColor(c); setOpen(false); }}
                  className={`h-6 w-6 rounded-md border transition-transform hover:scale-110 ${
                    currentColor === c ? "ring-2 ring-brand-500 ring-offset-1" : "border-gray-200"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
              <input
                type="color"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="h-6 w-6 cursor-pointer rounded border-0 p-0"
              />
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-mono text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="#000000"
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (/^#[0-9A-Fa-f]{6}$/.test(custom)) {
                    onChangeColor(custom);
                    setOpen(false);
                  }
                }}
                className="rounded-lg bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700"
              >
                Set
              </button>
            </div>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onClear(); setOpen(false); }}
              className="mt-2 w-full rounded-lg border border-gray-200 py-1 text-xs text-gray-500 hover:bg-gray-50"
            >
              Clear color
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function RichTextEditor({ value, onChange, placeholder = "Start writing…" }: Props) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { languageClassPrefix: "language-" },
      }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Image.configure({ inline: false, allowBase64: true }),
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Iframe,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: { class: "h-full" },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  function setLink() {
    const prev = editor!.getAttributes("link").href ?? "";
    const url  = window.prompt("Enter URL", prev);
    if (url === null) return;
    if (url === "") { editor!.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function handleMediaSelect(file: { url: string }) {
    editor!.chain().focus().setImage({ src: file.url, alt: "" }).run();
    setMediaOpen(false);
  }

  function handleEmbedInsert(src: string) {
    editor!.chain().focus().insertContent({ type: "iframe", attrs: { src } }).run();
  }

  const currentFontColor = editor.getAttributes("textStyle").color || "";
  const currentHighlight = editor.getAttributes("highlight").color || "";

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent">

      {/* Toolbar — fixed at top of editor, never scrolls */}
      <div className="shrink-0 flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-gray-50 px-3 py-1.5">

        {/* History */}
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Divider />

        {/* Font Family */}
        <FontSelect editor={editor} />

        <Divider />

        {/* Font Color */}
        <ColorPicker
          icon={<Palette className="h-3.5 w-3.5" />}
          title="Font color"
          currentColor={currentFontColor}
          onChangeColor={(c) => editor.chain().focus().setColor(c).run()}
          onClear={() => editor.chain().focus().unsetColor().run()}
        />

        {/* Highlight / Background Color */}
        <ColorPicker
          icon={<Highlighter className="h-3.5 w-3.5" />}
          title="Highlight color"
          currentColor={currentHighlight}
          onChangeColor={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
          onClear={() => editor.chain().focus().unsetHighlight().run()}
        />

        <Divider />

        {/* Text style */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
          <Code className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Divider />

        {/* Headings */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Divider />

        {/* Text alignment */}
        <AlignBtn editor={editor} align="left" title="Align left" />
        <AlignBtn editor={editor} align="center" title="Align center" />
        <AlignBtn editor={editor} align="right" title="Align right" />
        <AlignBtn editor={editor} align="justify" title="Justify" />

        <Divider />

        {/* Lists */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Divider />

        {/* Blocks */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <Quote className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
          <span className="font-mono text-xs font-bold">{"{}"}</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
          <Minus className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Divider />

        {/* Link */}
        <ToolbarBtn onClick={setLink} active={editor.isActive("link")} title="Set link">
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        {editor.isActive("link") && (
          <ToolbarBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link">
            <Link2Off className="h-3.5 w-3.5" />
          </ToolbarBtn>
        )}

        <Divider />

        {/* Image */}
        <ToolbarBtn onClick={() => setMediaOpen(true)} title="Insert image from media library">
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>

        {/* Embed */}
        <ToolbarBtn onClick={() => setEmbedOpen(true)} title="Insert video embed (YouTube, Vimeo, Facebook)">
          <MonitorPlay className="h-3.5 w-3.5" />
        </ToolbarBtn>
      </div>

      {/* Scrollable editor area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <EditorContent
          editor={editor}
          className="px-5 py-4 text-sm text-gray-800 leading-relaxed min-h-[500px]"
        />
      </div>

      {/* Media Library Modal */}
      {mediaOpen && (
        <MediaLibraryModal
          filterType="image"
          onSelect={handleMediaSelect}
          onClose={() => setMediaOpen(false)}
        />
      )}

      {/* Embed Dialog */}
      <EmbedDialog
        open={embedOpen}
        onClose={() => setEmbedOpen(false)}
        onInsert={handleEmbedInsert}
      />
    </div>
  );
}
