/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {LexicalEditor} from 'lexical';
import type {JSX} from 'react';

import {$createCodeNode, $isCodeNode} from '@lexical/code';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from '@lexical/markdown';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  $createTextNode,
  $getRoot,
  $isParagraphNode,
  CLEAR_EDITOR_COMMAND,
} from 'lexical';
import {useCallback, useEffect, useState} from 'react';

import useModal from '@/hooks/useModal';
import {useLocale} from '@/lib/i18n';
import Button from '@/components/editor-ui/Button';
import {PLAYGROUND_TRANSFORMERS} from '../MarkdownTransformers';
import {
  SPEECH_TO_TEXT_COMMAND,
  SUPPORT_SPEECH_RECOGNITION,
} from '../SpeechToTextPlugin';

export default function ActionsPlugin({
  isRichText,
  shouldPreserveNewLinesInMarkdown,
}: {
  isRichText: boolean;
  shouldPreserveNewLinesInMarkdown: boolean;
}): JSX.Element {
  const {t} = useLocale();
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const [isSpeechToText, setIsSpeechToText] = useState(false);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [modal, showModal] = useModal();
  useEffect(() => {
    return editor.registerEditableListener((editable) => {
      setIsEditable(editable);
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(
      () => {
        editor.getEditorState().read(() => {
          const root = $getRoot();
          const children = root.getChildren();

          if (children.length > 1) {
            setIsEditorEmpty(false);
          } else {
            if ($isParagraphNode(children[0])) {
              const paragraphChildren = children[0].getChildren();
              setIsEditorEmpty(paragraphChildren.length === 0);
            } else {
              setIsEditorEmpty(false);
            }
          }
        });
      },
    );
  }, [editor]);

  const handleMarkdownToggle = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const firstChild = root.getFirstChild();
      if ($isCodeNode(firstChild) && firstChild.getLanguage() === 'markdown') {
        $convertFromMarkdownString(
          firstChild.getTextContent(),
          PLAYGROUND_TRANSFORMERS,
          undefined, // node
          shouldPreserveNewLinesInMarkdown,
        );
      } else {
        const markdown = $convertToMarkdownString(
          PLAYGROUND_TRANSFORMERS,
          undefined, //node
          shouldPreserveNewLinesInMarkdown,
        );
        const codeNode = $createCodeNode('markdown');
        codeNode.append($createTextNode(markdown));
        root.clear().append(codeNode);
        if (markdown.length === 0) {
          codeNode.select();
        }
      }
    });
  }, [editor, shouldPreserveNewLinesInMarkdown]);

  return (
    <div className="actions">
      {SUPPORT_SPEECH_RECOGNITION && (
        // <button
        //   onClick={() => {
        //     editor.dispatchCommand(SPEECH_TO_TEXT_COMMAND, !isSpeechToText);
        //     setIsSpeechToText(!isSpeechToText);
        //   }}
        //   className={
        //     'action-button action-button-mic ' +
        //     (isSpeechToText ? 'active' : '')
        //   }
        //   title="Speech To Text"
        //   aria-label={`${
        //     isSpeechToText ? 'Enable' : 'Disable'
        //   } speech to text`}>
        //   <i className="mic" />
        // </button>
        null
      )}
      <button
        className="action-button clear"
        disabled={isEditorEmpty}
        onClick={() => {
          showModal(t.editor.actions.clear, (onClose) => (
            <ShowClearDialog editor={editor} onClose={onClose} />
          ));
        }}
        title={t.editor.actions.clear}
        aria-label={t.editor.actions.clear}>
        <i className="clear" />
      </button>
      <button
        className={`action-button ${!isEditable ? 'unlock' : 'lock'}`}
        onClick={() => {
          editor.setEditable(!editor.isEditable());
        }}
        title={!isEditable ? t.editor.actions.unlockReadOnly : t.editor.actions.lockReadOnly}
        aria-label={!isEditable ? t.editor.actions.unlockReadOnly : t.editor.actions.lockReadOnly}>
        <i className={!isEditable ? 'unlock' : 'lock'} />
      </button>
      <button
        className="action-button"
        onClick={handleMarkdownToggle}
        title={t.editor.actions.convertFromMarkdown}
        aria-label={t.editor.actions.convertFromMarkdown}>
        <i className="markdown" />
      </button>
      {modal}
    </div>
  );
}

function ShowClearDialog({
  editor,
  onClose,
}: {
  editor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const {t} = useLocale();
  return (
    <>
      {t.editor.actions.confirmClear}
      <div className="Modal__content">
        <Button
          onClick={() => {
            editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
            editor.focus();
            onClose();
          }}>
          {t.editor.actions.clear}
        </Button>{' '}
        <Button
          onClick={() => {
            editor.focus();
            onClose();
          }}>
          {t.editor.dialogs.cancel}
        </Button>
      </div>
    </>
  );
}
