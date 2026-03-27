"use client";

import { createClient } from "@/utils/supabase/client";
import { useRef, useState } from "react";
import { X } from "lucide-react";

export function ImageUpload({
  onUpload,
  onClose,
}: {
  onUpload: (url: string) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `plate/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(path, file, { upsert: false });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    onUpload(data.publicUrl);
    setUploading(false);
  };

  return (
    <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Bild hochladen:
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          className="text-sm text-zinc-600 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-zinc-700 hover:file:bg-zinc-50 dark:text-zinc-400 dark:file:border-zinc-600 dark:file:bg-zinc-800 dark:file:text-zinc-300"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          disabled={uploading}
        />
        {uploading && (
          <span className="text-sm text-zinc-500">Wird hochgeladen…</span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
