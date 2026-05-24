"use client";

import { useRef, useState } from "react";
import EmailEditor, { EditorRef, EmailEditorProps } from "react-email-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff, Save, Code, FileText } from "lucide-react";
import { TemplateType, getEmailTemplate } from "@/lib/email-templates";

export interface JSONTemplate {
  counters: Record<string, number>;
  body: {
    rows: Array<any>;
    values: {
      backgroundColor?: string;
      [key: string]: any;
    };
  };
  schemaVersion?: number;
  html?: string;
  classic?: boolean;
}

interface EmailEditorComponentProps {
  onSave?: (design: JSONTemplate) => void;
  onExport?: (html: string, design: JSONTemplate) => void;
  initialDesign?: JSONTemplate;
  onContentChange?: (html: string) => void;
}

export function EmailEditorComponent({
  onSave,
  onExport,
  initialDesign,
  onContentChange,
}: EmailEditorComponentProps) {
  const emailEditorRef = useRef<EditorRef | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const loadEmailTemplate = async (template: TemplateType) => {
    try {
      const { html } = await getEmailTemplate(template);
      const unlayer = emailEditorRef.current?.editor;
      if (!unlayer) return;
      
      // @ts-ignore
      unlayer.loadDesign({
        html,
        classic: true
      } as any);

      // Re-apply the configuration immediately after loading
      setTimeout(() => {
        unlayer.setAppearance({
          theme: "light",
          panels: {
            tools: {
              dock: "left"
            }
          }
        });
      }, 100);

      onContentChange?.(html);
    } catch (error) {
      console.error("Error loading template:", error);
    }
  };

  const handleSaveDesign = () => {
    const unlayer = emailEditorRef.current?.editor;
    if (!unlayer) return;

    unlayer.saveDesign((design: object) => {
      console.log('Design saved:', design);
      onSave?.(design as JSONTemplate);
    });
  };

  const handleExportHtml = () => {
    const unlayer = emailEditorRef.current?.editor;
    if (!unlayer) return;

    unlayer.exportHtml((data: { design: object; html: string }) => {
      const { design, html } = data;
      console.log('HTML exported:', html);
      onExport?.(html, design as JSONTemplate);
    });
  };

  const togglePreview = () => {
    const unlayer = emailEditorRef.current?.editor;
    console.log('Toggle preview clicked, editor instance:', unlayer);
    
    if (!unlayer) {
      console.error('Email editor not initialized');
      return;
    }

    try {
      if (isPreviewMode) {
        console.log('Hiding preview...');
        unlayer.hidePreview();
      } else {
        console.log('Showing preview...');
        // Force the preview mode with a slight delay to ensure the editor is ready
        setTimeout(() => {
          unlayer.showPreview({ device: 'desktop' });
        }, 100);
      }
      setIsPreviewMode(!isPreviewMode);
    } catch (error) {
      console.error('Error toggling preview:', error);
    }
  };

  const onLoad: EmailEditorProps['onLoad'] = (unlayer) => {
    console.log('Editor loaded');
    if (initialDesign) {
      // @ts-ignore
      unlayer.loadDesign(initialDesign);
    }
  };

  const onReady: EmailEditorProps['onReady'] = (unlayer) => {
    console.log('Editor ready');
    // Ensure the editor is properly configured after it's ready
    unlayer.addEventListener('design:loaded', () => {
      // Re-apply the configuration after template load
      unlayer.setAppearance({
        theme: "light",
        panels: {
          tools: {
            dock: "left"
          }
        }
      });
    });
  };

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="border-b px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* <Button
              variant="outline"
              size="sm"
              onClick={togglePreview}
              className="gap-1.5"
            >
              {isPreviewMode ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Vista Previa
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Vista Previa
                </>
              )}
            </Button> */}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDesign}
              className="gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              Guardar
            </Button> */}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={handleExportHtml}
              className="gap-1.5"
            >
              <Code className="h-3.5 w-3.5" />
              HTML
            </Button> */}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadEmailTemplate("welcome")}
              className="gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              Bienvenida
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadEmailTemplate("reminder")}
              className="gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              Recordatorio
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadEmailTemplate("followup")}
              className="gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              Seguimiento
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-grow relative">
        <div className="absolute inset-0 flex">
          <EmailEditor
            ref={emailEditorRef}
            onLoad={onLoad}
            onReady={onReady}
            options={{
              appearance: {
                theme: "light",
                panels: {
                  tools: {
                    dock: "left"
                  }
                }
              },
              tools: {
                button: {
                  enabled: true
                },
                text: {
                  enabled: true
                },
                image: {
                  enabled: true
                }
              },
              displayMode: "email",
              features: {
                preview: true
              }
            }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column"
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
