"use client";

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JSX } from "react";
import { useEffect, useCallback } from "react";

import { $createLinkNode } from "@lexical/link";
import { $createListItemNode, $createListNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isTextNode,
  DOMConversionMap,
  TextNode,
} from "lexical";

import { isDevPlayground } from "@/types/editor-settings";
import { FlashMessageContext } from "@/context/FlashMessageContext";
import { SettingsContext, useSettings } from "@/context/SettingsContext";
import { SharedHistoryContext } from "@/context/SharedHistoryContext";
import { ToolbarContext } from "@/context/ToolbarContext";
import Editor from "./editor/editor";
import logo from "@/public/images/logo.svg";
import PlaygroundNodes from "./editor/nodes/PlaygroundNodes";
import DocsPlugin from "./editor/plugins/DocsPlugin";
import { HtmlLoadPlugin } from "./editor/plugins/HtmlLoadPlugin";
import PasteLogPlugin from "./editor/plugins/PasteLogPlugin";
import { TableContext } from "./editor/plugins/TablePlugin";
import TestRecorderPlugin from "./editor/plugins/TestRecorderPlugin";
import { parseAllowedFontSize } from "./editor/plugins/ToolbarPlugin/fontSize";
import TypingPerfPlugin from "./editor/plugins/TypingPerfPlugin";
import Settings from "./editor/Settings";
import PlaygroundEditorTheme from "./editor/themes/PlaygroundEditorTheme";
import { parseAllowedColor } from "./editor-ui/ColorPicker";

console.warn(
  "If you are profiling the playground app, please ensure you turn off the debug view. You can disable it by pressing on the settings control in the bottom-left of your screen and toggling the debug view setting."
);

// We no longer need the prepopulated rich text function as we'll load content from the database

function getExtraStyles(element: HTMLElement): string {
  // Parse styles from pasted input, but only if they match exactly the
  // sort of styles that would be produced by exportDOM
  let extraStyles = "";
  const fontSize = parseAllowedFontSize(element.style.fontSize);
  const backgroundColor = parseAllowedColor(element.style.backgroundColor);
  const color = parseAllowedColor(element.style.color);
  if (fontSize !== "" && fontSize !== "15px") {
    extraStyles += `font-size: ${fontSize};`;
  }
  if (backgroundColor !== "" && backgroundColor !== "rgb(255, 255, 255)") {
    extraStyles += `background-color: ${backgroundColor};`;
  }
  if (color !== "" && color !== "rgb(0, 0, 0)") {
    extraStyles += `color: ${color};`;
  }
  return extraStyles;
}

function buildImportMap(): DOMConversionMap {
  const importMap: DOMConversionMap = {};

  // Wrap all TextNode importers with a function that also imports
  // the custom styles implemented by the playground
  for (const [tag, fn] of Object.entries(TextNode.importDOM() || {})) {
    importMap[tag] = (importNode) => {
      const importer = fn(importNode);
      if (!importer) {
        return null;
      }
      return {
        ...importer,
        conversion: (element) => {
          const output = importer.conversion(element);
          if (
            output === null ||
            output.forChild === undefined ||
            output.after !== undefined ||
            output.node !== null
          ) {
            return output;
          }
          const extraStyles = getExtraStyles(element);
          if (extraStyles) {
            const { forChild } = output;
            return {
              ...output,
              forChild: (child, parent) => {
                const textNode = forChild(child, parent);
                if ($isTextNode(textNode)) {
                  textNode.setStyle(textNode.getStyle() + extraStyles);
                }
                return textNode;
              },
            };
          }
          return output;
        },
      };
    };
  }

  return importMap;
}

// We've removed the App component and integrated its functionality directly into LexicalEditorWrapper

export function LexicalEditorWrapper({ onChange, value }: { onChange: (value: string) => void; value: string }): JSX.Element {
  // Use the imported isDevPlayground constant instead of trying to access it from settings

  // Create a plugin to handle content changes and call the onChange callback
  function OnChangePlugin({ onChange }: { onChange: (value: string) => void }) {
    const [editor] = useLexicalComposerContext();
    
    // Use useCallback for the update handler to prevent unnecessary re-renders
    const updateListener = useCallback(({ editorState }: {editorState: any}) => {
      // We'll use a timeout to avoid too many rapid updates
      const timeoutId = setTimeout(() => {
        editorState.read(() => {
          // Find the editor element in the DOM - do this inside the callback to ensure it's current
          const editorElement = document.querySelector('.editor-container .editor');
          
          // Get editor content as HTML
          if (editorElement instanceof HTMLElement) {
            const htmlString = editorElement.innerHTML || '';
            // Call the onChange callback with the HTML string
            onChange(htmlString);
          } else {
            // Fallback to serialized JSON if we can't find the editor element
            const jsonState = JSON.stringify(editorState.toJSON());
            onChange(jsonState);
          }
        });
      }, 250); // 250ms debounce
      
      return () => clearTimeout(timeoutId);
    }, [onChange]);
    
    // Register the update listener once when the component mounts
    useEffect(() => {
      return editor.registerUpdateListener(updateListener);
    }, [editor, updateListener]);
    
    return null;
  }

  return (
    <SettingsContext>
      <FlashMessageContext>
        <LexicalComposer initialConfig={{
          namespace: "Playground",
          nodes: [...PlaygroundNodes],
          onError: (error: Error) => {
            throw error;
          },
          theme: PlaygroundEditorTheme,
          html: { import: buildImportMap() },
        }}>
          <SharedHistoryContext>
            <TableContext>
              <ToolbarContext>
                <div className="editor-shell">
                  <Editor />
                  {value && <HtmlLoadPlugin html={value} />}
                  <OnChangePlugin onChange={onChange} />
                </div>
                {/* Only show these plugins in dev playground */}
                {isDevPlayground && <DocsPlugin />}
                {isDevPlayground && <PasteLogPlugin />}
                {isDevPlayground && <TestRecorderPlugin />}
              </ToolbarContext>
            </TableContext>
          </SharedHistoryContext>
        </LexicalComposer>
      </FlashMessageContext>
    </SettingsContext>
  );
}
