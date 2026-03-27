"use client";

import { type Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { BasicBlocksKit } from "@/components/editor/plugins/basic-blocks-kit";
import { BasicMarksKit } from "@/components/editor/plugins/basic-marks-kit";
import { LinkKit } from "@/components/editor/plugins/link-kit";
import { SlashKit } from "@/components/editor/plugins/slash-kit";
import { DndKit } from "@/components/editor/plugins/dnd-kit";
import { BlockMenuKit } from "@/components/editor/plugins/block-menu-kit";
import { ImagePlugin } from "@platejs/media/react";
import { ImageElement } from "@/components/ui/media-image-node";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { FixedToolbar } from "@/components/ui/fixed-toolbar";
import { FloatingToolbar } from "@/components/ui/floating-toolbar";
import { ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@/components/ui/toolbar";
import { MarkToolbarButton } from "@/components/ui/mark-toolbar-button";
import { LinkToolbarButton } from "@/components/ui/link-toolbar-button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ImageUpload } from "./image-upload";
import { useState, useCallback, useRef } from "react";
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
  ImageIcon,
  Save,
} from "lucide-react";

const emptyValue: Value = [{ type: "p", children: [{ text: "" }] }];

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

  const editor = usePlateEditor({
    plugins: [
      ...BasicBlocksKit,
      ...BasicMarksKit,
      ...LinkKit,
      ...SlashKit,
      ...DndKit,
      ...BlockMenuKit,
      ImagePlugin.withComponent(ImageElement),
    ],
    value: initialValue || emptyValue,
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

  const handleChange = useCallback(
    ({ value }: { value: Value }) => {
      valueRef.current = value;
    },
    []
  );

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2">
          <div className="flex items-center gap-3">
            {backUrl && (
              <a
                href={backUrl}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Zurück
              </a>
            )}
            {headerTitle && (
              <span className="text-sm font-medium text-foreground">
                {headerTitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImageUpload(true)}
              className="flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm text-foreground hover:bg-accent"
            >
              <ImageIcon className="h-4 w-4" />
              Bild
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>

        {/* Image Upload Dialog */}
        {showImageUpload && (
          <ImageUpload
            onUpload={handleImageUpload}
            onClose={() => setShowImageUpload(false)}
          />
        )}

        {/* Editor */}
        <Plate editor={editor} onChange={handleChange}>
          <FixedToolbar>
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => editor.tf.h1.toggle()}
                tooltip="Überschrift 1 (⌘+⌥+1)"
                data-plate-focus
              >
                <Heading1 />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.tf.h2.toggle()}
                tooltip="Überschrift 2 (⌘+⌥+2)"
                data-plate-focus
              >
                <Heading2 />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.tf.h3.toggle()}
                tooltip="Überschrift 3 (⌘+⌥+3)"
                data-plate-focus
              >
                <Heading3 />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.tf.h4.toggle()}
                tooltip="Überschrift 4 (⌘+⌥+4)"
                data-plate-focus
              >
                <Heading4 />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.tf.blockquote.toggle()}
                tooltip="Zitat"
                data-plate-focus
              >
                <Quote />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
              <MarkToolbarButton nodeType="bold" tooltip="Fett (⌘+B)">
                <Bold />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType="italic" tooltip="Kursiv (⌘+I)">
                <Italic />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType="underline" tooltip="Unterstrichen (⌘+U)">
                <Underline />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType="strikethrough" tooltip="Durchgestrichen (⌘+⇧+X)">
                <Strikethrough />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType="code" tooltip="Code (⌘+E)">
                <Code />
              </MarkToolbarButton>
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
              <LinkToolbarButton />
            </ToolbarGroup>
          </FixedToolbar>

          <FloatingToolbar>
            <ToolbarGroup>
              <MarkToolbarButton nodeType="bold" tooltip="Fett (⌘+B)">
                <Bold />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType="italic" tooltip="Kursiv (⌘+I)">
                <Italic />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType="underline" tooltip="Unterstrichen (⌘+U)">
                <Underline />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType="strikethrough" tooltip="Durchgestrichen (⌘+⇧+X)">
                <Strikethrough />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType="code" tooltip="Code (⌘+E)">
                <Code />
              </MarkToolbarButton>
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup>
              <LinkToolbarButton />
            </ToolbarGroup>
          </FloatingToolbar>

          <EditorContainer>
            <Editor variant="default" placeholder="Inhalt eingeben oder / für Befehle..." />
          </EditorContainer>
        </Plate>

        {/* Error toast */}
        {error && (
          <div className="fixed bottom-4 right-4 rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground shadow-lg">
            {error}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
