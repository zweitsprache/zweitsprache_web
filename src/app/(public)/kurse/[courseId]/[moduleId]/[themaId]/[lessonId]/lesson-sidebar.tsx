"use client";

import { useState } from "react";
import { PanelRightOpen, PanelRightClose } from "lucide-react";

export function LessonSidebar() {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-4 top-24 z-40 rounded-lg border border-zinc-200 bg-white p-2 shadow-md transition-opacity hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        aria-label={open ? "Sidebar schliessen" : "Sidebar öffnen"}
      >
        {open ? (
          <PanelRightClose className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        ) : (
          <PanelRightOpen className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        )}
      </button>

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col border-l border-zinc-200 bg-white shadow-xl transition-transform duration-300 ease-in-out dark:border-zinc-700 dark:bg-zinc-900 sm:w-[420px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Lektion
          </h3>
          <button
            onClick={() => setOpen(false)}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Sidebar schliessen"
          >
            <PanelRightClose className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-zinc-400">Inhalt folgt…</p>
        </div>
      </div>
    </>
  );
}
