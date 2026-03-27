'use client';

import type { PlateEditor } from 'platejs/react';

import { type TElement, KEYS, PathApi } from 'platejs';

export const insertBlock = (
  editor: PlateEditor,
  type: string,
  options: { upsert?: boolean } = {}
) => {
  const { upsert = false } = options;

  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block();

    if (!block) return;

    const [currentNode, path] = block;
    const isCurrentBlockEmpty = editor.api.isEmpty(currentNode);
    const currentBlockType = (currentNode as TElement).type;

    const isSameBlockType = type === currentBlockType;

    if (upsert && isCurrentBlockEmpty && isSameBlockType) {
      return;
    }

    editor.tf.insertNodes(editor.api.create.block({ type }), {
      at: PathApi.next(path),
      select: true,
    });

    if (!isSameBlockType) {
      editor.tf.removeNodes({ previousEmptyBlock: true });
    }
  });
};

export const insertInlineElement = (editor: PlateEditor, type: string) => {
  // Simplified: no inline elements used currently
};

export const setBlockType = (
  editor: PlateEditor,
  type: string,
) => {
  const entries = editor.api.blocks({ mode: 'lowest' });

  entries.forEach(([node, path]) => {
    if ((node as TElement).type !== type) {
      editor.tf.setNodes({ type }, { at: path });
    }
  });
};

export const getBlockType = (block: TElement) => {
  return block.type;
};
