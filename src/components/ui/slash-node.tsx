'use client';

import * as React from 'react';

import type { PlateEditor, PlateElementProps } from 'platejs/react';

import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  ImageIcon,
  PilcrowIcon,
  Quote,
} from 'lucide-react';
import { type TComboboxInputElement, KEYS } from 'platejs';
import { PlateElement } from 'platejs/react';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

type Group = {
  group: string;
  items: {
    icon: React.ReactNode;
    value: string;
    onSelect: (editor: PlateEditor, value: string) => void;
    className?: string;
    focusEditor?: boolean;
    keywords?: string[];
    label?: string;
  }[];
};

const groups: Group[] = [
  {
    group: 'Blöcke',
    items: [
      {
        icon: <PilcrowIcon />,
        keywords: ['paragraph', 'text'],
        label: 'Text',
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        keywords: ['title', 'h1', 'überschrift'],
        label: 'Überschrift 1',
        value: KEYS.h1,
      },
      {
        icon: <Heading2Icon />,
        keywords: ['subtitle', 'h2', 'überschrift'],
        label: 'Überschrift 2',
        value: KEYS.h2,
      },
      {
        icon: <Heading3Icon />,
        keywords: ['subtitle', 'h3', 'überschrift'],
        label: 'Überschrift 3',
        value: KEYS.h3,
      },
      {
        icon: <Heading4Icon />,
        keywords: ['h4', 'überschrift'],
        label: 'Überschrift 4',
        value: KEYS.h4,
      },
      {
        icon: <Quote />,
        keywords: ['citation', 'blockquote', 'quote', '>', 'zitat'],
        label: 'Zitat',
        value: KEYS.blockquote,
      },
      {
        icon: <ImageIcon />,
        keywords: ['image', 'bild', 'foto'],
        label: 'Bild',
        value: KEYS.img,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor: PlateEditor, value: string) => {
        if (value === KEYS.img) {
          editor.tf.insertNodes({
            type: KEYS.img,
            url: '',
            children: [{ text: '' }],
          });
        } else {
          editor.tf.insertNodes(
            editor.api.create.block({ type: value }),
            { select: true }
          );
        }
      },
    })),
  },
];

export function SlashInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>Keine Ergebnisse</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(
                ({ focusEditor, icon, keywords, label, value, onSelect }) => (
                  <InlineComboboxItem
                    key={value}
                    value={value}
                    onClick={() => onSelect(editor, value)}
                    label={label}
                    focusEditor={focusEditor}
                    group={group}
                    keywords={keywords}
                  >
                    <div className="mr-2 text-muted-foreground">{icon}</div>
                    {label ?? value}
                  </InlineComboboxItem>
                )
              )}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
