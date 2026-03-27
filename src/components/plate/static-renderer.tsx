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
  H1Static,
  H2Static,
  H3Static,
  H4Static,
  BlockquoteStatic,
  ParagraphStatic,
  LinkStatic,
  ImageStatic,
  BoldStatic,
  ItalicStatic,
  UnderlineStatic,
  StrikethroughStatic,
  CodeStatic,
} from "./static-components";

export function PlateRenderer({ value }: { value: unknown }) {
  if (!value || !Array.isArray(value) || value.length === 0) {
    return null;
  }

  const editor = createStaticEditor({
    plugins: [
      BaseH1Plugin.withComponent(H1Static),
      BaseH2Plugin.withComponent(H2Static),
      BaseH3Plugin.withComponent(H3Static),
      BaseH4Plugin.withComponent(H4Static),
      BaseBlockquotePlugin.withComponent(BlockquoteStatic),
      BaseBoldPlugin.withComponent(BoldStatic),
      BaseItalicPlugin.withComponent(ItalicStatic),
      BaseUnderlinePlugin.withComponent(UnderlineStatic),
      BaseStrikethroughPlugin.withComponent(StrikethroughStatic),
      BaseCodePlugin.withComponent(CodeStatic),
      BaseLinkPlugin.withComponent(LinkStatic),
      BaseImagePlugin.withComponent(ImageStatic),
    ],
    value,
    override: {
      components: {
        p: ParagraphStatic,
      },
    },
  });

  return <PlateStatic editor={editor} />;
}
