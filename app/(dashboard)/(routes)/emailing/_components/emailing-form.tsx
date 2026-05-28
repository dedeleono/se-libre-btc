"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Check, Send, Sparkles, Smartphone } from "lucide-react";
import { EmailSelector } from "./email-selector";
import { Editor } from "@/components/editor";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { handleTemplateSelect as createHandleTemplateSelect } from "@/lib/utils";
import { QuickActions } from "./quick-actions";
import { EmailEditorComponent, JSONTemplate } from "./email-editor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Student {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface EmailGroup {
  id: string;
  name: string;
  position: number;
  studentEmails: string[];
}

interface EmailingFormProps {
  students: Student[];
  groups: EmailGroup[];
}

export function EmailingForm({ students = [], groups = [] }: EmailingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [emailDesign, setEmailDesign] = useState<JSONTemplate | undefined>();
  const [recipients, setRecipients] = useState<string[]>([]);

  const handleTemplateSelect = (templateSubject: string, templateContent: string) => {
    setSubject(templateSubject);
    try {
      const parsedDesign = JSON.parse(templateContent);
      setEmailDesign(parsedDesign);
    } catch (error) {
      console.error("Error parsing template content:", error);
      toast.error("Error loading template");
    }
  };

  const emailGroups = [
    {
      id: "all-students",
      name: "Todos los estudiantes",
      position: -1,
      students: students.map((student) => ({ email: student.email })),
    },
    ...groups.map((group) => ({
      ...group,
      students: group.studentEmails.map((email) => ({ email })),
    })),
  ];

  const handleSendEmail = async () => {
    if (!subject || recipients.length === 0) {
      toast.error("Por favor complete todos los campos");
      return;
    }

    try {
      setIsLoading(true);

      if (!content) {
        toast.error("Por favor agregue contenido al email");
        return;
      }

      const response = await axios.post("/api/email/send", {
        subject,
        content,
        recipients
      });

      const { summary } = response.data;
      toast.success(
        `Email enviado exitosamente (${summary.successful}/${summary.total})`
      );
      
      // Clear form if all emails were sent successfully
      if (summary.successful === summary.total) {
        setSubject("");
        setContent("");
        setEmailDesign(undefined);
        setRecipients([]);
      }
    } catch (error) {
      toast.error("Error al enviar el email");
    } finally {
      setIsLoading(false);
    }
  };

  const MobileNotice = () => (
    <Alert className="mb-4 border-destructive bg-destructive/10 font-['Open_Sans']">
      <Smartphone className="h-5 w-5 !text-destructive" />
      <AlertTitle className="text-destructive font-bold">Pantalla no recomendada</AlertTitle>
      <AlertDescription className="text-xs">
        El editor de emails está optimizado para pantallas más grandes. Para una mejor experiencia,
        te recomendamos usar una tablet o computadora.
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-x-3">
        <div className="flex items-center gap-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 
            dark:from-primary/30 dark:via-primary/20 dark:to-transparent dark:border-white/[0.05] 
            dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm border">
            <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary dark:text-white/90" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold dark:text-white/90 font-['Open_Sans']">Nuevo Email</h2>
        </div>

        {/* <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground 
            dark:text-white/50 bg-muted/50 dark:bg-white/5 px-3 py-1.5 rounded-lg border 
            dark:border-white/10 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Plantillas Rápidas
          </div>
          <QuickActions onTemplateSelect={handleTemplateSelect} />
        </div> */}
      </div>

      <Tabs defaultValue="compose" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 
          dark:bg-black/40 dark:border dark:border-white/[0.08] 
          dark:backdrop-blur-sm">
          <TabsTrigger value="compose" 
            className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent
              dark:text-white/70 dark:data-[state=active]:bg-accent/20 
              dark:data-[state=active]:text-accent-foreground transition-colors">
            Componer
          </TabsTrigger>
          <TabsTrigger value="preview"
            className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent
              dark:text-white/70 dark:data-[state=active]:bg-accent/20 
              dark:data-[state=active]:text-accent-foreground transition-colors">
            Vista Previa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm sm:text-base font-medium dark:text-white/90">Destinatarios</Label>
              {recipients.length > 0 && (
                <Badge variant="default" 
                  className="bg-primary/20 text-primary dark:bg-primary/30 dark:text-white 
                    hover:bg-primary/30 dark:hover:bg-primary/40">
                  {recipients.length} seleccionados
                </Badge>
              )}
            </div>

            <div className="rounded-lg border dark:border-white/[0.08] bg-card/50 
              dark:bg-black/40 p-3 sm:p-4 shadow-inner dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
              <EmailSelector
                groups={emailGroups}
                onEmailsChange={setRecipients}
              />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <Label className="text-sm sm:text-base font-medium dark:text-white/90">Asunto</Label>
            <Input
              disabled={isLoading}
              placeholder="Escribe el asunto del email..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-card/50 dark:bg-black/40 border-2 dark:border-white/[0.08] 
                focus-visible:ring-primary/20 dark:focus-visible:ring-primary/30
                dark:placeholder:text-white/30 dark:text-white/90 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-3 sm:space-y-4">
            <Label className="text-sm sm:text-base font-medium dark:text-white/90">Contenido</Label>
            <div className="block sm:hidden">
              <MobileNotice />
            </div>
            <div className="w-full h-[700px] relative rounded-lg overflow-hidden border dark:border-white/[0.08] bg-background hidden sm:block">
              <EmailEditorComponent
                initialDesign={emailDesign}
                onContentChange={(html) => setContent(html)}
                onSave={(design) => setEmailDesign(design)}
              />
            </div>
            
          </div>

          <Button
            disabled={isLoading || recipients.length === 0 || !subject}
            onClick={handleSendEmail}
            className="w-full gap-2 bg-primary hover:bg-primary/90 dark:bg-primary/80 
              dark:hover:bg-primary/70 dark:text-white shadow-lg hover:shadow-xl
              transition-all duration-300 text-sm sm:text-base mt-4"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                Enviar a {recipients.length} destinatarios
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="preview">
          <div className="rounded-lg border-2 dark:border-white/[0.08] p-4 sm:p-6 bg-card/50 
            dark:bg-black/40 dark:backdrop-blur-sm">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 dark:text-white/90">
              {subject || "Sin asunto"}
            </h3>
            <div
              className="prose prose-sm max-w-none dark:prose-invert 
                dark:text-white/80"
              dangerouslySetInnerHTML={{ __html: content || "Sin contenido" }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
