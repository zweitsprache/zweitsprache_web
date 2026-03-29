import Link from "next/link";
import Image from "next/image";

const tools = [
  {
    key: "textgenerator",
    href: "/tools/textgenerator",
    title: "Textgenerator",
    subtitle: "Authentische Texte für den DaZ-Unterricht generieren",
    image:
      "/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg",
  },
  {
    key: "textkorrektor",
    href: "/tools/textkorrektor",
    title: "Textkorrektor",
    subtitle: "Handgeschriebene Texte fotografieren und automatisch korrigieren",
    image:
      "/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg",
  },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <div className="relative h-48 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 sm:h-56 md:h-64">
        <Image
          src="/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg"
          alt="Tools"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/80 to-slate-900/20 p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Tools</h1>
          <p className="mt-2 text-lg text-zinc-200">
            Werkzeuge für den DaZ-Unterricht
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.key}
            href={tool.href}
            className="group overflow-hidden rounded-lg border border-zinc-200 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <div className="relative h-48 bg-zinc-100 dark:bg-zinc-800">
              <Image
                src={tool.image}
                alt={tool.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/60 to-transparent p-4">
                <h2 className="text-lg font-semibold text-white group-hover:underline">
                  {tool.title}
                </h2>
                {tool.subtitle && (
                  <p className="mt-0.5 text-sm text-zinc-200">{tool.subtitle}</p>
                )}
              </div>
            </div>
            <div className="p-4">
              <span className="mt-1 block rounded-md bg-teal-700 px-4 py-2 text-center text-sm font-medium text-white group-hover:bg-teal-800">
                Öffnen
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
