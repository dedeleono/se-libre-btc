/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
"use client"
import type { JSX } from "react";

import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { CharacterLimitPlugin } from "@lexical/react/LexicalCharacterLimitPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { SelectionAlwaysOnDisplay } from "@lexical/react/LexicalSelectionAlwaysOnDisplay";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { CAN_USE_DOM } from "@lexical/utils";
import * as React from "react";
import { useEffect, useState } from "react";

import { createWebsocketProvider } from "@/components/editor/collaboration";
import { useSettings } from "@/context/SettingsContext";
import { useSharedHistoryContext } from "@/context/SharedHistoryContext";
import ActionsPlugin from "@/components/editor/plugins/ActionsPlugin";
import AutocompletePlugin from "@/components/editor/plugins/AutocompletePlugin";
import AutoEmbedPlugin from "@/components/editor/plugins/AutoEmbedPlugin";
import AutoLinkPlugin from "@/components/editor/plugins/AutoLinkPlugin";
import CodeActionMenuPlugin from "@/components/editor/plugins/CodeActionMenuPlugin";
import CodeHighlightPrismPlugin from "@/components/editor/plugins/CodeHighlightPrismPlugin";
import CodeHighlightShikiPlugin from "@/components/editor/plugins/CodeHighlightShikiPlugin";
import CollapsiblePlugin from "@/components/editor/plugins/CollapsiblePlugin";
import CommentPlugin from "@/components/editor/plugins/CommentPlugin";
import ComponentPickerPlugin from "@/components/editor/plugins/ComponentPickerPlugin";
import ContextMenuPlugin from "@/components/editor/plugins/ContextMenuPlugin";
import DateTimePlugin from "@/components/editor/plugins/DateTimePlugin";
import DragDropPaste from "@/components/editor/plugins/DragDropPastePlugin";
import DraggableBlockPlugin from "@/components/editor/plugins/DraggableBlockPlugin";
import EmojiPickerPlugin from "@/components/editor/plugins/EmojiPickerPlugin";
import EmojisPlugin from "@/components/editor/plugins/EmojisPlugin";
import EquationsPlugin from "@/components/editor/plugins/EquationsPlugin";
import ExcalidrawPlugin from "@/components/editor/plugins/ExcalidrawPlugin";
import FigmaPlugin from "@/components/editor/plugins/FigmaPlugin";
import FloatingLinkEditorPlugin from "@/components/editor/plugins/FloatingLinkEditorPlugin";
import FloatingTextFormatToolbarPlugin from "@/components/editor/plugins/FloatingTextFormatToolbarPlugin";
import ImagesPlugin from "@/components/editor/plugins/ImagesPlugin";
import InlineImagePlugin from "@/components/editor/plugins/InlineImagePlugin";
import KeywordsPlugin from "@/components/editor/plugins/KeywordsPlugin";
import { LayoutPlugin } from "@/components/editor/plugins/LayoutPlugin/LayoutPlugin";
import LinkPlugin from "@/components/editor/plugins/LinkPlugin";
import MarkdownShortcutPlugin from "@/components/editor/plugins/MarkdownShortcutPlugin";
import { MaxLengthPlugin } from "@/components/editor/plugins/MaxLengthPlugin";
import MentionsPlugin from "@/components/editor/plugins/MentionsPlugin";
import PageBreakPlugin from "@/components/editor/plugins/PageBreakPlugin";
import PollPlugin from "@/components/editor/plugins/PollPlugin";
import ShortcutsPlugin from "@/components/editor/plugins/ShortcutsPlugin";
import SpecialTextPlugin from "@/components/editor/plugins/SpecialTextPlugin";
import SpeechToTextPlugin from "@/components/editor/plugins/SpeechToTextPlugin";
import TabFocusPlugin from "@/components/editor/plugins/TabFocusPlugin";
import TableCellActionMenuPlugin from "@/components/editor/plugins/TableActionMenuPlugin";
import TableCellResizer from "@/components/editor/plugins/TableCellResizer";
import TableHoverActionsPlugin from "@/components/editor/plugins/TableHoverActionsPlugin";
import TableOfContentsPlugin from "@/components/editor/plugins/TableOfContentsPlugin";
import ToolbarPlugin from "@/components/editor/plugins/ToolbarPlugin";
import TreeViewPlugin from "@/components/editor/plugins/TreeViewPlugin";
import TwitterPlugin from "@/components/editor/plugins/TwitterPlugin";
import YouTubePlugin from "@/components/editor/plugins/YouTubePlugin";
import ContentEditable from "@/components/editor-ui/ContentEditable";

const skipCollaborationInit =
  // @ts-expect-error
  typeof window !== 'undefined' && window.parent != null && window.parent.frames.right === window;

export default function Editor(): JSX.Element {
  const { historyState } = useSharedHistoryContext();
  const {
    settings: {
      isCodeHighlighted,
      isCodeShiki,
      isCollab,
      isAutocomplete,
      isMaxLength,
      isCharLimit,
      hasLinkAttributes,
      isCharLimitUtf8,
      isRichText,
      showTreeView,
      showTableOfContents,
      shouldUseLexicalContextMenu,
      shouldPreserveNewLinesInMarkdown,
      tableCellMerge,
      tableCellBackgroundColor,
      tableHorizontalScroll,
      shouldAllowHighlightingWithBrackets,
      selectionAlwaysOnDisplay,
      listStrictIndent,
    },
  } = useSettings();
  const isEditable = useLexicalEditable();
  const placeholder = isCollab
    ? "Enter some collaborative rich text..."
    : isRichText
      ? "Enter some rich text..."
      : "Enter some plain text...";
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && typeof window !== 'undefined' && window.matchMedia("(max-width: 1025px)").matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    
    if (typeof window !== 'undefined') {
      updateViewPortWidth();
      window.addEventListener("resize", updateViewPortWidth);

      return () => {
        window.removeEventListener("resize", updateViewPortWidth);
      };
    }
  }, [isSmallWidthViewport]);

  return (
    <>
      {isRichText && (
        <ToolbarPlugin
          editor={editor}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
          setIsLinkEditMode={setIsLinkEditMode}
        />
      )}
      {isRichText && (
        <ShortcutsPlugin
          editor={activeEditor}
          setIsLinkEditMode={setIsLinkEditMode}
        />
      )}
      <div
        className={`editor-container ${showTreeView ? "tree-view" : ""} ${
          !isRichText ? "plain-text" : ""
        }`}
      >
        {isMaxLength && <MaxLengthPlugin maxLength={30} />}
        <DragDropPaste />
        <AutoFocusPlugin />
        {selectionAlwaysOnDisplay && <SelectionAlwaysOnDisplay />}
        <ClearEditorPlugin />
        <ComponentPickerPlugin />
        <EmojiPickerPlugin />
        <AutoEmbedPlugin />
        <MentionsPlugin />
        <EmojisPlugin />
        <HashtagPlugin />
        <KeywordsPlugin />
        <SpeechToTextPlugin />
        <AutoLinkPlugin />
        <DateTimePlugin />
        <CommentPlugin
          providerFactory={isCollab ? createWebsocketProvider : undefined}
        />
        {isRichText ? (
          <>
            {isCollab ? (
              <CollaborationPlugin
                id="main"
                providerFactory={createWebsocketProvider}
                shouldBootstrap={!skipCollaborationInit}
              />
            ) : (
              <HistoryPlugin externalHistoryState={historyState} />
            )}
            <RichTextPlugin
              contentEditable={
                <div className="editor-scroller">
                  <div className="editor" ref={onRef}>
                    <ContentEditable placeholder={placeholder} />
                  </div>
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <MarkdownShortcutPlugin />
            {isCodeHighlighted &&
              (isCodeShiki ? (
                <CodeHighlightShikiPlugin />
              ) : (
                <CodeHighlightPrismPlugin />
              ))}
            <ListPlugin hasStrictIndent={listStrictIndent} />
            <CheckListPlugin />
            <TablePlugin
              hasCellMerge={tableCellMerge}
              hasCellBackgroundColor={tableCellBackgroundColor}
              hasHorizontalScroll={tableHorizontalScroll}
            />
            <TableCellResizer />
            <ImagesPlugin />
            <InlineImagePlugin />
            <LinkPlugin hasLinkAttributes={hasLinkAttributes} />
            <PollPlugin />
            <TwitterPlugin />
            <YouTubePlugin />
            <FigmaPlugin />
            <ClickableLinkPlugin disabled={isEditable} />
            <HorizontalRulePlugin />
            <EquationsPlugin />
            <ExcalidrawPlugin />
            <TabFocusPlugin />
            <TabIndentationPlugin maxIndent={7} />
            <CollapsiblePlugin />
            <PageBreakPlugin />
            <LayoutPlugin />
            {floatingAnchorElem && (
              <>
                <FloatingLinkEditorPlugin
                  anchorElem={floatingAnchorElem}
                  isLinkEditMode={isLinkEditMode}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
                <TableCellActionMenuPlugin
                  anchorElem={floatingAnchorElem}
                  cellMerge={true}
                />
              </>
            )}
            {floatingAnchorElem && !isSmallWidthViewport && (
              <>
                <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
                <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
                <FloatingTextFormatToolbarPlugin
                  anchorElem={floatingAnchorElem}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
              </>
            )}
          </>
        ) : (
          <>
            <PlainTextPlugin
              contentEditable={<ContentEditable placeholder={placeholder} />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin externalHistoryState={historyState} />
          </>
        )}
        {(isCharLimit || isCharLimitUtf8) && (
          <CharacterLimitPlugin
            charset={isCharLimit ? "UTF-16" : "UTF-8"}
            maxLength={5}
          />
        )}
        {isAutocomplete && <AutocompletePlugin />}
        <div>{showTableOfContents && <TableOfContentsPlugin />}</div>
        {shouldUseLexicalContextMenu && <ContextMenuPlugin />}
        {shouldAllowHighlightingWithBrackets && <SpecialTextPlugin />}
        <ActionsPlugin
          isRichText={isRichText}
          shouldPreserveNewLinesInMarkdown={shouldPreserveNewLinesInMarkdown}
        />
      </div>
      {showTreeView && <TreeViewPlugin />}
    </>
  );
}
