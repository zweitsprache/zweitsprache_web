'use client';

import * as React from 'react';

import {
  BLOCK_CONTEXT_MENU_ID,
  BlockMenuPlugin,
  BlockSelectionPlugin,
} from '@platejs/selection/react';
import { KEYS } from 'platejs';
import {
  useEditorPlugin,
  useEditorReadOnly,
  usePluginOption,
} from 'platejs/react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useIsTouchDevice } from '@/hooks/use-is-touch-device';

export function BlockContextMenu({ children }: { children: React.ReactNode }) {
  const { api, editor } = useEditorPlugin(BlockMenuPlugin);
  const isTouch = useIsTouchDevice();
  const readOnly = useEditorReadOnly();
  const openId = usePluginOption(BlockMenuPlugin, 'openId');
  const isOpen = openId === BLOCK_CONTEXT_MENU_ID;

  const handleTurnInto = React.useCallback(
    (type: string) => {
      editor
        .getApi(BlockSelectionPlugin)
        .blockSelection.getNodes()
        .forEach(([node, path]) => {
          if (node[KEYS.listType]) {
            editor.tf.unsetNodes([KEYS.listType, 'indent'], {
              at: path,
            });
          }

          editor.tf.toggleBlock(type, { at: path });
        });
    },
    [editor]
  );

  if (isTouch) {
    return children;
  }

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) {
          api.blockMenu.hide();
        }
      }}
    >
      <ContextMenuTrigger
        onContextMenu={(event) => {
          const dataset = (event.target as HTMLElement).dataset;
          const disabled =
            dataset?.slateEditor === 'true' ||
            readOnly ||
            dataset?.plateOpenContextMenu === 'false';

          if (disabled) return event.preventDefault();

          setTimeout(() => {
            api.blockMenu.show(BLOCK_CONTEXT_MENU_ID, {
              x: event.clientX,
              y: event.clientY,
            });
          }, 0);
        }}
        render={<div className="w-full" />}
      >
        {children}
      </ContextMenuTrigger>
      {isOpen && (
        <ContextMenuContent
          className="w-64"
        >
          <ContextMenuGroup>
            <ContextMenuItem
              onClick={() => {
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.removeNodes();
                editor.tf.focus();
              }}
            >
              Löschen
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.duplicate();
              }}
            >
              Duplizieren
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Umwandeln in</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.p)}>
                  Text
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h1)}>
                  Überschrift 1
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h2)}>
                  Überschrift 2
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleTurnInto(KEYS.h3)}>
                  Überschrift 3
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleTurnInto(KEYS.blockquote)}
                >
                  Zitat
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
