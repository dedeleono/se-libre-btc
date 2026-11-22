/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {JSX} from 'react';

import {LexicalEditor} from 'lexical';
import * as React from 'react';
import {useState} from 'react';

import Button from '@/components/editor-ui/Button';
import {useLocale} from '@/lib/i18n';
import type {Messages} from '@/lib/i18n/messages';
import DropDown, {DropDownItem} from '@/components/editor-ui/DropDown';
import {INSERT_LAYOUT_COMMAND} from './LayoutPlugin';

const LAYOUTS: {key: keyof Messages['editor']['layout']; value: string}[] = [
  {key: 'twoEqual', value: '1fr 1fr'},
  {key: 'twoQuarterThreeQuarters', value: '1fr 3fr'},
  {key: 'threeEqual', value: '1fr 1fr 1fr'},
  {key: 'threeQuarterHalfQuarter', value: '1fr 2fr 1fr'},
  {key: 'fourEqual', value: '1fr 1fr 1fr 1fr'},
];

export default function InsertLayoutDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const {t} = useLocale();
  const [layout, setLayout] = useState(LAYOUTS[0].value);
  const selected = LAYOUTS.find((item) => item.value === layout);
  const buttonLabel = selected ? t.editor.layout[selected.key] : undefined;

  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_LAYOUT_COMMAND, layout);
    onClose();
  };

  return (
    <>
      <DropDown
        buttonClassName="toolbar-item dialog-dropdown"
        buttonLabel={buttonLabel}>
        {LAYOUTS.map(({key, value}) => (
          <DropDownItem
            key={value}
            className="item"
            onClick={() => setLayout(value)}>
            <span className="text">{t.editor.layout[key]}</span>
          </DropDownItem>
        ))}
      </DropDown>
      <Button onClick={onClick}>{t.editor.dialogs.insert}</Button>
    </>
  );
}
