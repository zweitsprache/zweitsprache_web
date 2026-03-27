"use client";

import { type Value } from "platejs";
import {
  Plate,
  PlateContent,
  usePlateEditor,
} from "platejs/react";
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  H4Plugin,
  BlockquotePlugin,
} from "@platejs/basic-nodes/react";
import { LinkPlugin } from "@platejs/link/react";
import { ImagePlugin } from "@platejs/media/react";
import {
  H1Element,
  H2Element,
  H3Element,
  H4Element,
  BlockquoteElement,
  ParagraphElement,
  LinkElement,
  ImageElement,
  BoldLeaf,
  ItalicLeaf,
  UnderlineLeaf,
  StrikethroughLeaf,
  CodeLeaf,
} from "./components";
import { ImageUpload } from "./image-upload";
import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Quote,
  Link,
  ImageIcon,
  Save,
  Type,
} from "lucide-react";

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`rounded p-1.5 transition-colors ${
        active
          ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: NonNullable<ReturnType<typeof usePlateEditor>> }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
      <ToolbarButton
        onClick={() => editor.tf.h1.toggle()}
        title="Überschrift 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.tf.h2.toggle()}
        title="Überschrift 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.tf.h3.toggle()}
        title="Überschrift 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.tf.h4.toggle()}
        title="Überschrift 4"
      >
        <Heading4 className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1.5 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      <ToolbarButton
        onClick={() => editor.tf.bold.toggle()}
        title="Fett (⌘+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.tf.italic.toggle()}
        title="Kursiv (⌘+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.tf.underline.toggle()}
        title="Unterstrichen (⌘+U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.tf.strikethrough.toggle()}
        title="Durchgestrichen"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.tf.code.toggle()} title="Code">
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1.5 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      <ToolbarButton
        onClick={() => editor.tf.blockquote.toggle()}
        title="Zitat"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          const url = window.prompt("Link-URL:");
          if (url) {
            editor.tf.link.insert({ url });
          }
        }}
        title="Link einfügen"
      >
        <Link className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

const emptyValue: Value = [{ type: "p", children: [{ text: "" }] }];

// ── Slash menu ──

interface SlashMenuItem {
  key: string;
  label: string;
  icon: ReactNode;
  type: string;
}

const slashItems: SlashMenuItem[] = [
  { key: "p", label: "Text", icon: <Type className="h-4 w-4" />, type: "p" },
  { key: "h1", label: "Überschrift 1", icon: <Heading1 className="h-4 w-4" />, type: "h1" },
  { key: "h2", label: "Überschrift 2", icon: <Heading2 className="h-4 w-4" />, type: "h2" },
  { key: "h3", label: "Überschrift 3", icon: <Heading3 className="h-4 w-4" />, type: "h3" },
  { key: "h4", label: "Überschrift 4", icon: <Heading4 className="h-4 w-4" />, type: "h4" },
  { key: "blockquote", label: "Zitat", icon: <Quote className="h-4 w-4" />, type: "blockquote" },
  { key: "image", label: "Bild", icon: <ImageIcon className="h-4 w-4" />, type: "img" },
];

function SlashMenu({
  position,
  search,
  onSelect,
  onClose,
}: {
  position: { top: number; left: number };
  search: string;
  onSelect: (item: SlashMenuItem) => void;
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = slashItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-1.5 text-xs font-medium text-zinc-400">
        Einfügen
      </div>
      {filtered.map((item, i) => (
        <button
          key={item.key}
          type="button"
          className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
            i === selectedIndex
              ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
          onMouseEnter={() => setSelectedIndex(i)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function PlateEditor({
  initialValue,
  onSave,
  headerTitle,
  backUrl,
}: {
  initialValue: Value | null;
  onSave: (value: Value) => Promise<void>;
  headerTitle?: string;
  backUrl?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const valueRef = useRef<Value>(initialValue || emptyValue);
  const [slashMenu, setSlashMenu] = useState<{
    position: { top: number; left: number };
    search: string;
  } | null>(null);

  const editor = usePlateEditor({
    plugins: [
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      H4Plugin.withComponent(H4Element),
      BlockquotePlugin.withComponent(BlockquoteElement),
      BoldPlugin.withComponent(BoldLeaf),
      ItalicPlugin.withComponent(ItalicLeaf),
      UnderlinePlugin.withComponent(UnderlineLeaf),
      StrikethroughPlugin.withComponent(StrikethroughLeaf),
      CodePlugin.withComponent(CodeLeaf),
      LinkPlugin.withComponent(LinkElement),
      ImagePlugin.withComponent(ImageElement),
    ],
    value: initialValue || emptyValue,
    override: {
      components: {
        p: ParagraphElement,
      },
    },
  })!;

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(valueRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }, [onSave]);

  const handleImageUpload = useCallback(
    (url: string) => {
      editor.tf.insertNodes({
        type: "img",
        url,
        children: [{ text: "" }],
      });
      setShowImageUpload(false);
    },
    [editor]
  );

  // Slash menu: detect "/" typed at start of a block
  const getCaretPosition = useCallback(() => {
    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) return null;
    const range = domSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    return { top: rect.bottom + 4, left: rect.left };
  }, []);

  const handleSlashSelect = useCallback(
    (item: SlashMenuItem) => {
      // Delete the "/" (and any search text) from the current block
      if (editor.selection) {
        const [node, path] = editor.api.node(editor.selection) ?? [];
        if (node) {
          const blockPath = path!.slice(0, 1);
          const blockEntry = editor.api.node(blockPath);
          if (blockEntry) {
            const text = editor.api.string(blockPath);
            // Remove the slash + search text
            const slashStart = text.indexOf("/");
            if (slashStart >= 0) {
              editor.tf.select({
                anchor: { path: [...blockPath, 0], offset: slashStart },
                focus: { path: [...blockPath, 0], offset: text.length },
              });
              editor.tf.deleteFragment();
            }
          }
        }
      }

      if (item.type === "img") {
        setShowImageUpload(true);
      } else {
        editor.tf.setNodes(
          { type: item.type },
          { at: editor.selection ?? undefined }
        );
      }
      setSlashMenu(null);
    },
    [editor]
  );

  // Track onChange to detect slash command
  const handleChange = useCallback(
    ({ value }: { value: Value }) => {
      valueRef.current = value;

      if (!editor.selection) {
        setSlashMenu(null);
        return;
      }

      // Get text of the current block
      const blockPath = editor.selection.anchor.path.slice(0, 1);
      const text = editor.api.string(blockPath);

      if (text.startsWith("/")) {
        const search = text.slice(1);
        const pos = getCaretPosition();
        if (pos) {
          setSlashMenu({ position: pos, search });
        }
      } else {
        setSlashMenu(null);
      }
    },
    [editor, getCaretPosition]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          {backUrl && (
            <a
              href={backUrl}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              ← Zurück
            </a>
          )}
          {headerTitle && (
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {headerTitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImageUpload(true)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ImageIcon className="h-4 w-4" />
            Bild
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Save className="h-4 w-4" />
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar editor={editor} />

      {/* Image Upload Dialog */}
      {showImageUpload && (
        <ImageUpload
          onUpload={handleImageUpload}
          onClose={() => setShowImageUpload(false)}
        />
      )}

      {/* Editor */}
      <div className="flex-1 overflow-auto bg-white dark:bg-zinc-950">
        <Plate
          editor={editor}
          onChange={handleChange}
        >
          <PlateContent
            className="mx-auto min-h-[60vh] max-w-4xl px-8 py-8 outline-none"
            placeholder="Inhalt eingeben..."
          />
        </Plate>
      </div>

      {/* Slash menu */}
      {slashMenu && (
        <SlashMenu
          position={slashMenu.position}
          search={slashMenu.search}
          onSelect={handleSlashSelect}
          onClose={() => setSlashMenu(null)}
        />
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 rounded-md bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
