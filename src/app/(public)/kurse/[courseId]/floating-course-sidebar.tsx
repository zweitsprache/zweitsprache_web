"use client";

import { useState } from "react";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { CourseSidebar } from "./course-sidebar";

type Lesson = {
  id: string;
  title: string;
  sort_order: number;
};

type Thema = {
  id: string;
  title: string;
  sort_order: number;
  lessons: Lesson[];
};

type Module = {
  id: string;
  title: string;
  sort_order: number;
  themen: Thema[];
};

export function FloatingCourseSidebar({
  courseId,
  courseTitle,
  modules,
}: {
  courseId: string;
  courseTitle: string;
  modules: Module[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-24 z-40 rounded-lg border border-zinc-200 bg-white p-2 shadow-md transition-opacity hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        aria-label={open ? "Navigation schliessen" : "Navigation öffnen"}
      >
        {open ? (
          <PanelLeftClose className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        ) : (
          <PanelLeftOpen className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        )}
      </button>

      {/* Panel */}
      <div
        className={`fixed left-0 top-0 z-50 flex h-full w-[360px] flex-col border-r border-zinc-200 bg-white shadow-xl transition-transform duration-300 ease-in-out dark:border-zinc-700 dark:bg-zinc-900 sm:w-[420px] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Kursnavigation
          </h3>
          <button
            onClick={() => setOpen(false)}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Navigation schliessen"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <CourseSidebar
            courseId={courseId}
            courseTitle={courseTitle}
            modules={modules}
          />
        </div>
      </div>
    </>
  );
}
