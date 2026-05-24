"use client";

import { useRef, useEffect } from "react";

interface LexicalPreviewProps {
  value: string;
  editable?: boolean;
}

export function LexicalPreview({ value, editable = false }: LexicalPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle empty content - moved outside the component body
  
  useEffect(() => {
    if (!value) {
      return;
    }
    if (!containerRef.current) return;

    // Extract just the content we want to display
    const parser = new DOMParser();
    const doc = parser.parseFromString(value, 'text/html');
    
    // Remove the toolbar - these are the actual selectors from Lexical
    const toolbarElements = doc.querySelectorAll('.toolbar, .actions, .floating-text-format-popup');
    toolbarElements.forEach(el => el.remove());

    // Get just the content part
    const contentElement = doc.querySelector('.editor-input, .editor');
    
    if (contentElement) {
      // Use just the content element's HTML
      containerRef.current.innerHTML = contentElement.innerHTML;
    } else {
      // Fallback to the full HTML if we can't find the content element
      containerRef.current.innerHTML = value;
    }

    // Disable editing if not editable
    if (!editable) {
      // Add global style to hide any remaining toolbars
      const style = document.createElement('style');
      style.textContent = `
        .lexical-preview .toolbar,
        .lexical-preview .actions,
        .lexical-preview .floating-text-format-popup,
        .lexical-preview [role="toolbar"],
        .lexical-preview [data-lexical-toolbar="true"] {
          display: none !important;
        }
      `;
      containerRef.current.appendChild(style);
      
      // Make everything non-editable
      containerRef.current.querySelectorAll('*').forEach(el => {
        if (el instanceof HTMLElement) {
          el.contentEditable = 'false';
        }
      });

      // Block all editing events
      const preventEdit = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      containerRef.current.addEventListener('input', preventEdit, true);
      containerRef.current.addEventListener('keydown', preventEdit, true);
      containerRef.current.addEventListener('paste', preventEdit, true);
      containerRef.current.addEventListener('cut', preventEdit, true);
      
      // Store a reference to the current container to avoid stale refs in cleanup
      const currentContainer = containerRef.current;
      
      return () => {
        if (currentContainer) {
          currentContainer.removeEventListener('input', preventEdit, true);
          currentContainer.removeEventListener('keydown', preventEdit, true);
          currentContainer.removeEventListener('paste', preventEdit, true);
          currentContainer.removeEventListener('cut', preventEdit, true);
        }
      };
    }
  }, [value, editable]);

  return (
    <div 
      ref={containerRef}
      className={`lexical-preview ${editable ? 'editable' : 'readonly'}`}
      style={{
        userSelect: editable ? 'text' : 'none',
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
}
