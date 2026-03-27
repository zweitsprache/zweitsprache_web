import type { SlateElementProps, SlateLeafProps } from "platejs/static";
import { SlateElement, SlateLeaf } from "platejs/static";

// ── Elements ──

export function H1Static(props: SlateElementProps) {
  return (
    <SlateElement
      {...props}
      as="h1"
      className="mb-4 mt-8 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
    />
  );
}

export function H2Static(props: SlateElementProps) {
  return (
    <SlateElement
      {...props}
      as="h2"
      className="mb-3 mt-6 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
    />
  );
}

export function H3Static(props: SlateElementProps) {
  return (
    <SlateElement
      {...props}
      as="h3"
      className="mb-2 mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100"
    />
  );
}

export function H4Static(props: SlateElementProps) {
  return (
    <SlateElement
      {...props}
      as="h4"
      className="mb-2 mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100"
    />
  );
}

export function BlockquoteStatic(props: SlateElementProps) {
  return (
    <SlateElement
      {...props}
      as="blockquote"
      className="my-4 border-l-4 border-zinc-300 pl-4 italic text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"
    />
  );
}

export function ParagraphStatic(props: SlateElementProps) {
  return (
    <SlateElement
      {...props}
      as="p"
      className="mb-3 leading-relaxed text-zinc-700 dark:text-zinc-300"
    />
  );
}

export function LinkStatic(props: SlateElementProps) {
  const { element, children, attributes } = props;
  const url = (element as { url?: string }).url || "#";
  const target = (element as { target?: string }).target;
  return (
    <a
      {...attributes}
      href={url}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
    >
      {children}
    </a>
  );
}

export function ImageStatic(props: SlateElementProps) {
  const { element, children } = props;
  const url = (element as { url?: string }).url || "";
  const caption = (element as { caption?: string }).caption;
  return (
    <SlateElement {...props} className="my-4">
      {url ? (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={caption || ""}
            className="mx-auto h-auto max-w-full rounded-md"
          />
          {caption && (
            <figcaption className="mt-2 text-center text-sm text-zinc-500">
              {caption}
            </figcaption>
          )}
        </figure>
      ) : null}
      {children}
    </SlateElement>
  );
}

// ── Marks (leaves) ──

export function BoldStatic(props: SlateLeafProps) {
  return <SlateLeaf {...props} as="strong" className="font-bold" />;
}

export function ItalicStatic(props: SlateLeafProps) {
  return <SlateLeaf {...props} as="em" className="italic" />;
}

export function UnderlineStatic(props: SlateLeafProps) {
  return <SlateLeaf {...props} as="u" className="underline" />;
}

export function StrikethroughStatic(props: SlateLeafProps) {
  return <SlateLeaf {...props} as="s" className="line-through" />;
}

export function CodeStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf
      {...props}
      as="code"
      className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800"
    />
  );
}
