"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlateElementProps } from "platejs/react";
import { PlateElement, useEditorRef } from "platejs/react";
import { useComboboxInput } from "@platejs/combobox/react";
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Quote,
  Type,
  ImageIcon,
  Link,
} from "lucide-react";

interface SlashItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export function SlashInputElement(props: PlateElementProps) {
  const { children, element } = props;
  const editor = useEditorRef();
  const inputRef = useRef<HTMLElement>(null);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { removeInput } = useComboboxInput({
    ref: inputRef,
    onCancelInput: () => {
      removeInput(true);
    },
  });

  const setBlockType = useCallback(
    (type: string) => {
      removeInput();
      editor.tf.setNodes({ type }, { at: editor.selection ?? undefined });
    },
    [editor, removeInput]
  );

  const items: SlashItem[] = useMemo(
    () => [
      {
        key: "p",
        label: "Text",
        icon: <Type className="h-4 w-4" />,
        onSelect: () => setBlockType("p"),
      },
      {
        key: "h1",
        label: "Überschrift 1",
        icon: <Heading1 className="h-4 w-4" />,
        onSelect: () => setBlockType("h1"),
      },
      {
        key: "h2",
        label: "Überschrift 2",
        icon: <Heading2 className="h-4 w-4" />,
        onSelect: () => setBlockType("h2"),
      },
      {
        key: "h3",
        label: "Überschrift 3",
        icon: <Heading3 className="h-4 w-4" />,
        onSelect: () => setBlockType("h3"),
      },
      {
        key: "h4",
        label: "Überschrift 4",
        icon: <Heading4 className="h-4 w-4" />,
        onSelect: () => setBlockType("h4"),
      },
      {
        key: "blockquote",
        label: "Zitat",
        icon: <Quote className="h-4 w-4" />,
        onSelect: () => setBlockType("blockquote"),
      },
      {
        key: "image",
        label: "Bild",
        icon: <ImageIcon className="h-4 w-4" />,
        onSelect: () => {
          removeInput();
          editor.tf.insertNodes({
            type: "img",
            url: "",
            children: [{ text: "" }],
          });
        },
      },
      {
        key: "link",
        label: "Link",
        icon: <Link className="h-4 w-4" />,
        onSelect: () => {
          removeInput();
          const url = window.prompt("Link-URL:");
          if (url) {
            editor.tf.insertNodes({
              type: "a",
              url,
              children: [{ text: url }],
            });
          }
        },
      },
    ],
    [editor, removeInput, setBlockType]
  );

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase())
      ),
    [items, search]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Extract text from the slash_input element for filtering
  useEffect(() => {
    const text = (element.children as { text?: string }[])
      ?.map((c) => c.text || "")
      .join("");
    setSearch(text);
  }, [element.children]);

  const selectItem = useCallback(
    (index: number) => {
      const item = filtered[index];
      if (item) {
        item.onSelect();
      }
    },
    [filtered]
  );

  // Handle keyboard navigation
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
        selectItem(selectedIndex);
      } else if (e.key === "Escape") {
        e.preventDefault();
        removeInput(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, selectItem, removeInput]);

  return (
    <PlateElement {...props} as="span" className="relative inline-block">
      <span className="hidden">{children}</span>
      <div
        className="absolute left-0 top-6 z-50 w-64 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        contentEditable={false}
      >
        <div className="px-3 py-1.5 text-xs font-medium text-zinc-400">
          Einfügen
        </div>
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-sm text-zinc-400">
            Keine Ergebnisse
          </div>
        )}
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
              selectItem(i);
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
    </PlateElement>
  );
}
