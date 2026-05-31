"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, Clock, CreditCard, Loader2, FileText, ChevronRight, Loader } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ResourcesCard } from "./resources-card";
import { Preview } from "@/components/preview";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CompletionButton, CompletionButtonRef } from "./completion-button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Editor } from "@/components/editor";
import { DiscussionSection } from "./discussion-section";
import { User } from "@prisma/client";

interface ContentViewerProps {
  videoUrl?: string | null;
  pdfUrl?: string | null;
  richContent?: string | null;
  youtubeUrl?: string | null;
  title: string;
  courseId: string;
  chapterId: string;
  nextChapterId?: string;
  isLocked: boolean;
  lockType?: "time" | "subscription" | "intro";
  startTime?: Date | null;
  endTime?: Date | null;
  completeOnEnd: boolean;
  progress?: number;
  description?: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  isAuthenticated?: boolean;
  currentUser?: User;
}

interface LockScreenProps {
  type: "time" | "subscription" | "intro";
  startTime?: Date | null;
  endTime?: Date | null;
  courseId: string;
}

const LockScreen = ({ type, startTime, endTime, courseId }: LockScreenProps) => {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-14rem)]">
      <Card className="p-8 max-w-md mx-auto text-center space-y-6 shadow-lg relative">
        {type === "intro" && (
          <>
            <div className="mx-auto w-fit p-4 rounded-full bg-emerald-100">
              <Lock className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold">Contenido de Muestra</h2>
            <p className="text-sm text-muted-foreground">
              Esta es una lección gratuita de muestra. ¡Explora el contenido y descubre lo que puedes aprender!
            </p>
          </>
        )}

        {type === "time" && (
          <>
            <div className="mx-auto w-fit p-4 rounded-full bg-yellow-100">
              <Clock className="h-12 w-12 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold">Tiempo Restringido</h2>
            <p className="text-sm text-muted-foreground">
              {!startTime 
                ? "Esta lección aún no está disponible"
                : `Esta lección estará disponible el ${new Date(startTime).toLocaleDateString()}`
              }
              {endTime && ` hasta el ${new Date(endTime).toLocaleDateString()}`}
            </p>
          </>
        )}

        {type === "subscription" && (
          <>
            <div className="mx-auto w-fit p-4 rounded-full bg-blue-100">
              <CreditCard className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">Contenido bloqueado</h2>
            <p className="text-sm text-muted-foreground">
              Inscríbete gratis para acceder a este contenido.
            </p>
            <Button asChild className="w-full">
              <Link href={`/courses/preview/${courseId}`}>Ver curso</Link>
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export const ContentViewer = ({
  videoUrl,
  pdfUrl,
  richContent,
  youtubeUrl,
  title,
  courseId,
  chapterId,
  nextChapterId,
  isLocked,
  lockType,
  startTime,
  endTime,
  completeOnEnd,
  progress = 0,
  description,
  attachments,
  isAuthenticated = true,
  currentUser,
}: ContentViewerProps) => {
  
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "discussion" | "notes">("content");
  const completionRef = useRef<CompletionButtonRef>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  

  useEffect(() => {
    // Check if we're in preview mode by checking both lockType and cookie
    const hasCookie = document.cookie.split('; ').some(cookie => 
      cookie.startsWith(`intro_chapter_${chapterId}=`)
    );
    console.log('hasCookie', hasCookie);
    setIsPreviewMode(lockType === "intro" && hasCookie);
  }, [lockType, chapterId]);

  useEffect(() => {
    setIsCompleted(progress === 100);
  }, [progress]);

  // Load existing notes when component mounts
  useEffect(() => {
    const loadNotes = async () => {
      if (!isAuthenticated || isPreviewMode) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/notes?chapterId=${chapterId}`);
        if (!response.ok) throw new Error("Failed to load notes");
        
        const data = await response.json();
        if (data?.content) {
          setNotes(data.content);
        }
      } catch (error) {
        console.error("Error loading notes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [chapterId, isAuthenticated, isPreviewMode]);

  const onVideoEnd = () => {
    if (completeOnEnd && completionRef.current && isAuthenticated && !isPreviewMode) {
      completionRef.current.complete();
    }
  };

  const handleSaveNotes = async () => {
    if (!isAuthenticated || isPreviewMode) return;
    
    try {
      setIsSavingNotes(true);
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: notes,
          chapterId,
          courseId,
        }),
      });

      if (!response.ok) throw new Error("Failed to save notes");
      
      toast.success("Notes saved successfully");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleTabChange = (tab: "content" | "discussion" | "notes") => {
    if (isPreviewMode && tab !== "content") {
      toast.info("Upgrade your access to use all features");
      return;
    }
    setActiveTab(tab);
  };

  if (isLocked && (lockType === "time" || lockType === "subscription")) {
    return <LockScreen type={lockType} startTime={startTime} endTime={endTime} courseId={courseId} />;
  }

  return (
    <div className="relative flex flex-col w-full max-w-5xl mx-auto p-4 gap-y-4">
      <Card
        className="p-6 bg-background shadow-sm dark:bg-gradient-to-br dark:from-card/50 dark:to-background/30 
        dark:border-white/[0.05] dark:backdrop-blur-xl"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-0">
            <div className="flex items-center gap-2">
              <Label className="text-2xl font-bold capitalize dark:text-white/90 font-['Open_Sans'] pl-5 pt-5">
                {title}
              </Label>
              {isPreviewMode && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 border-emerald-200
                  dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                >
                  Preview
                </Badge>
              )}
            </div>
            {description && description.trim() && (
              <div className="text-sm text-muted-foreground dark:text-white/70">
                <Preview value={description} />
              </div>
            )}
          </div>
          {isLoading && isAuthenticated && !isPreviewMode && (
            <div
              className="flex items-center justify-center bg-primary/10 text-primary p-2 rounded-md
              dark:bg-white/[0.08] dark:text-white/90"
            >
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <p className="text-sm">Actualizando progreso...</p>
            </div>
          )}
        </div>
        {progress > 0 && isAuthenticated && !isPreviewMode && (
          <div className="mt-0 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground dark:text-white/70">
              <span>Course Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </Card>

      {isAuthenticated && (
        <div className="flex gap-x-2 border-b dark:border-white/[0.05]">
          <button
            onClick={() => handleTabChange("content")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "content"
                ? "border-b-2 border-primary text-primary dark:border-secondary dark:text-secondary"
                : "text-muted-foreground dark:text-white/70"
            )}
          >
            Contenido
          </button>
          {!isPreviewMode && (
            <>
              <button
                onClick={() => handleTabChange("notes")}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "notes"
                    ? "border-b-2 border-primary text-primary dark:border-secondary dark:text-secondary"
                    : "text-muted-foreground dark:text-white/70"
                )}
              >
                Notas
              </button>
              <button
                onClick={() => handleTabChange("discussion")}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "discussion"
                    ? "border-b-2 border-primary text-primary dark:border-secondary dark:text-secondary"
                    : "text-muted-foreground dark:text-white/70"
                )}
              >
                Discusión
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === "content" || isPreviewMode ? (
        <>
          <Card
            className="overflow-hidden bg-background dark:bg-gradient-to-br dark:from-card/50 
            dark:to-background/30 dark:border-white/[0.05] dark:backdrop-blur-xl"
          >
            <div className="relative w-full">
              {videoUrl && (
                <div className="aspect-video">
                  <video
                    className={cn(
                      "w-full h-full",
                      isLoading && "opacity-50 transition-opacity"
                    )}
                    src={videoUrl}
                    controls
                    onEnded={onVideoEnd}
                  />
                </div>
              )}

              {youtubeUrl && (
                <div className="aspect-video">
                  <iframe
                    src={youtubeUrl}
                    className="w-full h-full"
                    allowFullScreen
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}

              {pdfUrl && (
                <div className="relative min-h-[500px] w-full bg-slate-100">
                  <div className="absolute inset-0">
                    <iframe
                      src={`${pdfUrl}#toolbar=0`}
                      className="w-full h-full border-none"
                    />
                  </div>
                </div>
              )}

              {richContent && (
                <div className="p-6">
                  <div className="prose max-w-none">
                    <Preview value={richContent} />
                  </div>
                </div>
              )}

              {!videoUrl && !youtubeUrl && !pdfUrl && !richContent && (
                <div
                  className="flex flex-col items-center justify-center h-[400px] bg-slate-50 rounded-md
                  dark:bg-white/[0.02] dark:backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div
                        className="h-20 w-20 rounded-full bg-primary/10 dark:bg-white/[0.08] 
                        flex items-center justify-center"
                      >
                        <Loader2 className="h-12 w-12 text-primary dark:text-secondary animate-spin" />
                      </div>
                      <div
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary/10 
                        dark:bg-white/[0.08] flex items-center justify-center"
                      >
                        <FileText className="h-4 w-4 text-primary dark:text-secondary" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold text-lg dark:text-white/90">
                        Loading Content
                      </h3>
                      <p className="text-sm text-muted-foreground dark:text-white/70">
                        Please wait while we prepare your lesson
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(videoUrl || youtubeUrl) && isLoading && (
                <div
                  className="absolute inset-0 bg-background/80 dark:bg-black/50 backdrop-blur-sm 
                  flex items-center justify-center z-10"
                >
                  <div className="flex items-center space-x-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-secondary" />
                    <p className="text-sm font-medium dark:text-white/90">
                      Loading video...
                    </p>
                  </div>
                </div>
              )}

              {pdfUrl && isLoading && (
                <div
                  className="absolute inset-0 bg-background/80 dark:bg-black/50 backdrop-blur-sm 
                  flex items-center justify-center z-10"
                >
                  <div className="flex items-center space-x-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-secondary" />
                    <p className="text-sm font-medium dark:text-white/90">
                      Loading document...
                    </p>
                  </div>
                </div>
              )}

              {richContent && isLoading && (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              )}
            </div>
          </Card>

          {isAuthenticated &&
            !isPreviewMode &&
            attachments &&
            attachments.length > 0 && (
              <ResourcesCard attachments={attachments} />
            )}

          {isAuthenticated && !isPreviewMode && (
            <Card
              className="p-6 bg-background shadow-sm dark:bg-gradient-to-br dark:from-card/50 
              dark:to-background/30 dark:border-white/[0.05] dark:backdrop-blur-xl"
            >
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="notes"
                    className="text-sm font-semibold flex items-center gap-x-2 dark:text-white/90"
                  >
                    <FileText className="h-4 w-4" />
                    Libreta Digital
                  </Label>
                  <div className="mt-2">
                    <Editor
                      value={notes}
                      onChange={(value) => {
                        setNotes(value);
                      }}
                      height="300px"
                      className="border border-gray-200 rounded-lg"
                      style={{
                        minHeight: "200px",
                        maxHeight: "400px",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isLoading
                      ? "Cargando notas..."
                      : isSavingNotes
                        ? "Guardando notas..."
                        : "Tus notas se guardan automáticamente"}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={handleSaveNotes}
                    className="text-sm"
                    disabled={isSavingNotes}
                  >
                    {isSavingNotes ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Notas"
                    )}
                  </Button>

                  {completeOnEnd && (
                    <CompletionButton
                      ref={completionRef}
                      courseId={courseId}
                      chapterId={chapterId}
                      nextChapterId={nextChapterId}
                    />
                  )}
                </div>
              </div>
            </Card>
          )}

          {isPreviewMode && (
            <Card className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="font-semibold text-emerald-800 dark:text-emerald-400">
                    Te gustaría continuar?
                  </h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-500">
                    Regístrate para acceder al curso completo y todas sus
                    características.
                  </p>
                </div>
                <Button
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Link href="/sign-in">Inicia aquí</Link>
                </Button>
              </div>
            </Card>
          )}
        </>
      ) : activeTab === "notes" ? (
        <Card
          className="p-6 bg-background shadow-sm dark:bg-gradient-to-br dark:from-card/50 
          dark:to-background/30 dark:border-white/[0.05] dark:backdrop-blur-xl"
        >
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold flex items-center gap-x-2 dark:text-white/90">
                <FileText className="h-4 w-4" />
                Libreta Digital
              </Label>
              <div className="mt-2">
                {notes ? (
                  <div className="prose max-w-none">
                    {typeof notes === 'string' && notes.startsWith('{"root":') ? (
                      <div className="text-sm">
                        {JSON.parse(notes).root?.children?.[0]?.children?.[0]?.text || "No hay contenido disponible"}
                      </div>
                    ) : (
                      <Preview value={notes} />
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground dark:text-white/70">
                    No hay notas aún. Agrega tus notas en la pestaña de
                    contenido.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card
          className="p-6 bg-background shadow-sm dark:bg-gradient-to-br dark:from-card/50 
          dark:to-background/30 dark:border-white/[0.05] dark:backdrop-blur-xl"
        >
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold dark:text-white/90">
                Comparte tus ideas y preguntas
              </Label>
              <div className="mt-4">
                <DiscussionSection
                  chapterId={chapterId}
                  currentUser={currentUser!}
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
