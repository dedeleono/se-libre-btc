"use client";

import { LexicalEditorWrapper } from "./lexical-editor-wrapper";

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Editor = ({ 
  onChange, 
  value, 
  height = "auto",
  className = "",
  style = {}
}: EditorProps) => {
  const editorStyle = {
    minHeight: typeof height === "number" ? `${height}px` : height,
    ...style
  };

  return (
    <div 
      className={`editor-wrapper ${className}`} 
      style={{
        ...editorStyle,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <LexicalEditorWrapper onChange={onChange} value={value} />
    </div>
  );
};
