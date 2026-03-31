"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditor as useTiptapEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Link from "@tiptap/extension-link";
import { Mark, mergeAttributes } from "@tiptap/core";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered,
  Link as LinkIcon, Link2Off, Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon, Undo2, Redo2, Pilcrow,
  Heading1, Heading2, Heading3, RemoveFormatting, Quote, WrapText,
} from "lucide-react";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";

/* ── Custom Heading extension with noMargin attribute ────── */
const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      noMargin: {
        default: false,
        parseHTML: (element: HTMLElement) => element.classList.contains("no-margin"),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.noMargin) return {};
          return { class: "no-margin" };
        },
      },
    };
  },
});

/* ── NoBreak mark ── */
const NoBreak = Mark.create({
  name: "nobreak",
  inclusive: true,
  excludes: "",
  parseHTML() {
    return [{ tag: "span[data-nobreak]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-nobreak": "", class: "nobreak" }),
      0,
    ];
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  floatingElement?: React.ReactNode;
  editorClassName?: string;
}

function ToolbarButton({
  onClick,
  isActive,
  icon: Icon,
  label,
  disabled,
}: {
  onClick: () => void;
  isActive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Toggle
      size="sm"
      pressed={isActive}
      onPressedChange={() => onClick()}
      disabled={disabled}
      className="h-7 w-7 p-0 data-[state=on]:bg-accent"
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
    </Toggle>
  );
}

export function RichTextEditor({
  content,
  onChange,
  placeholder,
  editable = true,
  floatingElement,
  editorClassName,
}: RichTextEditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEditorFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setShowToolbar(true);
  }, []);

  const handleEditorBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => {
      if (wrapperRef.current?.contains(document.activeElement)) return;
      setShowToolbar(false);
    }, 150);
  }, []);

  const editor = useTiptapEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false }),
      CustomHeading.configure({ levels: [1, 2, 3] }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: placeholder ?? "Text eingeben…" }),
      TextStyle,
      Color,
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline cursor-pointer" },
      }),
      NoBreak,
    ],
    content,
    editable,
    onFocus: handleEditorFocus,
    onBlur: handleEditorBlur,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: editorClassName ?? "prose prose-sm max-w-none focus:outline-none min-h-[60px] px-3 py-2",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (!editor.isFocused && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const handleToolbarFocusIn = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL eingeben:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <TooltipProvider delay={300}>
      <div ref={wrapperRef} className="rounded-md border border-input bg-background">
        {/* Toolbar */}
        {editable && showToolbar && (
          <div
            className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-1.5 py-1"
            onFocus={handleToolbarFocusIn}
          >
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} icon={Undo2} label="Rückgängig" disabled={!editor.can().undo()} />
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} icon={Redo2} label="Wiederholen" disabled={!editor.can().redo()} />
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive("paragraph")} icon={Pilcrow} label="Absatz" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} icon={Heading1} label="Überschrift 1" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} icon={Heading2} label="Überschrift 2" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} icon={Heading3} label="Überschrift 3" />
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} icon={Bold} label="Fett" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} icon={Italic} label="Kursiv" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} icon={UnderlineIcon} label="Unterstrichen" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} icon={Strikethrough} label="Durchgestrichen" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive("highlight")} icon={Highlighter} label="Hervorheben" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive("subscript")} icon={SubscriptIcon} label="Tiefgestellt" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive("superscript")} icon={SuperscriptIcon} label="Hochgestellt" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleMark("nobreak").run()} isActive={editor.isActive("nobreak")} icon={WrapText} label="Kein Umbruch" />
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} icon={AlignLeft} label="Linksbündig" />
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} icon={AlignCenter} label="Zentriert" />
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} icon={AlignRight} label="Rechtsbündig" />
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} isActive={editor.isActive({ textAlign: "justify" })} icon={AlignJustify} label="Blocksatz" />
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} icon={List} label="Aufzählung" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} icon={ListOrdered} label="Nummerierung" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} icon={Quote} label="Zitat" />
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ToolbarButton onClick={setLink} isActive={editor.isActive("link")} icon={LinkIcon} label="Link" />
            {editor.isActive("link") && (
              <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} icon={Link2Off} label="Link entfernen" />
            )}
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} icon={RemoveFormatting} label="Formatierung entfernen" />
          </div>
        )}
        <div style={{ overflow: "hidden" }}>
          {floatingElement}
          <EditorContent editor={editor} />
        </div>
      </div>
    </TooltipProvider>
  );
}
