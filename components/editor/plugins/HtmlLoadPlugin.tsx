import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateNodesFromDOM } from "@lexical/html";
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $setSelection } from "lexical";

export function HtmlLoadPlugin({ html }: { html?: string }) {
  const [editor] = useLexicalComposerContext();
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!html || html.trim() === "") return;
    
    // Only load content on initial mount or if initialLoadRef is true
    if (!initialLoadRef.current) return;
    
    // Load the HTML content into the editor
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      const root = $getRoot();
      
      // Save current selection if any
      const currentSelection = $getSelection();

      // Clear existing content
      root.clear();

      try {
        // Generate nodes from the HTML DOM
        const nodes = $generateNodesFromDOM(editor, dom);

        // Insert the nodes into the editor
        if (nodes && nodes.length > 0) {
          nodes.forEach((node) => {
            root.append(node);
          });
        }
        
        // Restore selection if it existed
        if (currentSelection) {
          $setSelection(currentSelection);
        }
      } catch (error) {
        console.error("Error parsing HTML:", error);
        // If parsing fails, at least show the raw HTML
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(html));
        root.append(paragraph);
      }
      
      // Mark as loaded
      initialLoadRef.current = false;
    });
  }, [editor, html]);

  return null;
}
