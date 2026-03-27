"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, BookOpen, FileText } from "lucide-react";
import { useState } from "react";

type Lesson = {
  id: string;
  title: string;
  sort_order: number;
};

type Module = {
  id: string;
  title: string;
  sort_order: number;
  lessons: Lesson[];
};

export function CourseSidebar({
  courseId,
  courseTitle,
  modules,
}: {
  courseId: string;
  courseTitle: string;
  modules: Module[];
}) {
  const pathname = usePathname();

  const isOverviewActive = pathname === `/kurse/${courseId}`;

  return (
    <nav className="flex flex-col gap-1">
      <Link
        href={`/kurse/${courseId}`}
        className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
          isOverviewActive
            ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
        }`}
      >
        Übersicht
      </Link>

      {modules.map((mod, index) => (
        <ModuleSection
          key={mod.id}
          module={mod}
          courseId={courseId}
          index={index + 1}
          pathname={pathname}
        />
      ))}
    </nav>
  );
}

function ModuleSection({
  module: mod,
  courseId,
  index,
  pathname,
}: {
  module: Module;
  courseId: string;
  index: number;
  pathname: string;
}) {
  const moduleHref = `/kurse/${courseId}/${mod.id}`;
  const isModuleActive = pathname === moduleHref;
  const isChildActive = mod.lessons.some(
    (l) => pathname === `/kurse/${courseId}/${mod.id}/${l.id}`
  );
  const [open, setOpen] = useState(isModuleActive || isChildActive);

  return (
    <div>
      <div className="flex items-center">
        <button
          onClick={() => setOpen(!open)}
          className="shrink-0 rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <Link
          href={moduleHref}
          className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
            isModuleActive
              ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {index}. {mod.title}
          </span>
        </Link>
      </div>

      {open && mod.lessons.length > 0 && (
        <div className="ml-5 flex flex-col gap-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-700">
          {mod.lessons.map((lesson, li) => {
            const lessonHref = `/kurse/${courseId}/${mod.id}/${lesson.id}`;
            const isLessonActive = pathname === lessonHref;

            return (
              <Link
                key={lesson.id}
                href={lessonHref}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  isLessonActive
                    ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
                }`}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{lesson.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
