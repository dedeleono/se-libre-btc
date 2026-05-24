"use client";

import { useState } from "react";
import { Editor } from "./editor";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableEditorProps {
  onChange: (value: string) => void;
  value: string;
  defaultHeight?: string;
  maxHeight?: string;
  className?: string;
  placeholder?: string;
}

export const ExpandableEditor = ({
  onChange,
  value,
  defaultHeight = "400px",
  maxHeight = "80vh",
  className = "",
  placeholder = "Start typing your content..."
}: ExpandableEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const editorHeight = isFullscreen 
    ? "100vh" 
    : isExpanded 
    ? maxHeight 
    : defaultHeight;

  return (
    <div className={cn(
      "relative border border-gray-200 rounded-lg bg-white transition-all duration-300",
      isFullscreen && "fixed inset-0 z-50 border-0 rounded-none",
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpand}
            className="h-8 px-2"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 px-2"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div 
        className="transition-all duration-300 overflow-hidden"
        style={{ 
          height: editorHeight,
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Editor
          value={value}
          onChange={onChange}
          height="100%"
          style={{
            height: "100%",
            border: "none",
            borderRadius: 0,
            flex: 1,
            overflow: "hidden"
          }}
        />
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="absolute top-3 right-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-white/90 backdrop-blur-sm"
          >
            Exit Fullscreen
          </Button>
        </div>
      )}
    </div>
  );
};
