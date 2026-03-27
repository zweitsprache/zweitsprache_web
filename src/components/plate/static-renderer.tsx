import { createStaticEditor, PlateStatic } from "platejs/static";
import {
  BaseH1Plugin,
  BaseH2Plugin,
  BaseH3Plugin,
  BaseH4Plugin,
  BaseBlockquotePlugin,
  BaseBoldPlugin,
  BaseItalicPlugin,
  BaseUnderlinePlugin,
  BaseStrikethroughPlugin,
  BaseCodePlugin,
} from "@platejs/basic-nodes";
import { BaseLinkPlugin } from "@platejs/link";
import { BaseImagePlugin } from "@platejs/media";
import {
  H1ElementStatic,
  H2ElementStatic,
  H3ElementStatic,
  H4ElementStatic,
} from "@/components/ui/heading-node-static";
import { BlockquoteElementStatic } from "@/components/ui/blockquote-node-static";
import { ParagraphElementStatic } from "@/components/ui/paragraph-node-static";
import { CodeLeafStatic } from "@/components/ui/code-node-static";
import { LinkElementStatic } from "@/components/ui/link-node-static";
import { ImageElementStatic } from "@/components/ui/media-image-node-static";

export function PlateRenderer({ value }: { value: unknown }) {
  if (!value || !Array.isArray(value) || value.length === 0) {
    return null;
  }

  const editor = createStaticEditor({
    plugins: [
      BaseH1Plugin.withComponent(H1ElementStatic),
      BaseH2Plugin.withComponent(H2ElementStatic),
      BaseH3Plugin.withComponent(H3ElementStatic),
      BaseH4Plugin.withComponent(H4ElementStatic),
      BaseBlockquotePlugin.withComponent(BlockquoteElementStatic),
      BaseBoldPlugin,
      BaseItalicPlugin,
      BaseUnderlinePlugin,
      BaseStrikethroughPlugin,
      BaseCodePlugin.withComponent(CodeLeafStatic),
      BaseLinkPlugin.withComponent(LinkElementStatic),
      BaseImagePlugin.withComponent(ImageElementStatic),
    ],
    value,
    override: {
      components: {
        p: ParagraphElementStatic,
      },
    },
  });

  return <PlateStatic editor={editor} />;
}
