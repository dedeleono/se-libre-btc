"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Loader2, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ResourcesCard } from "./resources-card";
import { Preview } from "@/components/preview";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CompletionButton, CompletionButtonRef } from "./completion-button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { DiscussionSection } from "./discussion-section";
import { User } from "@prisma/client";
import { useLocale } from "@/lib/i18n";

const WalletSimulator = dynamic(() => import("@/components/wallet-simulator"), {
  ssr: false,
  loading: () => <SimulatorLoading />,
});

function SimulatorLoading() {
  const { t } = useLocale();
  return <div className="p-6 text-sm text-muted-foreground">{t.course.loadingSimulator}</div>;
}

// The Lexical-based Editor (~15 @lexical/* packages) is only used for the
// authenticated notes feature. Load it on demand so it stays out of the
// chapter's first-load JS bundle.
const Editor = dynamic(
  () => import("@/components/editor").then((m) => m.Editor),
  {
    ssr: false,
    loading: () => <Skeleton className="h-40 w-full" />,
  }
);

interface ContentViewerProps {
  videoUrl?: string | null;
  pdfUrl?: string | null;
  richContent?: string | null;
  youtubeUrl?: string | null;
  title: string;
  courseId: string;
  chapterId: string;
  nextChapterId?: string;
  lockType?: "intro";
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
  hasWalletSimulator?: boolean;
}

export const ContentViewer = ({
  videoUrl,
  pdfUrl,
  richContent,
  youtubeUrl,
  title,
  courseId,
  chapterId,
  nextChapterId,
  lockType,
  completeOnEnd,
  progress = 0,
  description,
  attachments,
  isAuthenticated = true,
  currentUser,
  hasWalletSimulator = false,
}: ContentViewerProps) => {
  const { t } = useLocale();
  
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
        if (!response.ok) throw new Error(t.course.notesLoadError);
        
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
  }, [chapterId, isAuthenticated, isPreviewMode, t.course.notesLoadError]);

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

      if (!response.ok) throw new Error(t.course.notesSaveError);
      
      toast.success(t.course.notesSaved);
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error(t.course.notesSaveError);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleTabChange = (tab: "content" | "discussion" | "notes") => {
    if (isPreviewMode && tab !== "content") {
      toast.info(t.course.upgradeAccess);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-y-4 p-4">
      <Card className="p-4 sm:p-6">
        <header className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-2">
            <h1 className="min-w-0 flex-1 basis-full text-balance text-[clamp(1.75rem,1.25rem+2vw,2.25rem)] leading-[1.05] [overflow-wrap:anywhere] sm:basis-0">
              {title}
            </h1>
            {isPreviewMode && (
              <Badge variant="secondary" className="bg-secondary text-foreground">
                {t.course.preview}
              </Badge>
            )}
          </div>
          {description?.trim() && <Preview value={description} className="lesson-content" />}
          {progress > 0 && isAuthenticated && !isPreviewMode && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-bold text-muted-foreground">
                <span>{t.course.courseProgress}</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </header>
      </Card>

      {isAuthenticated && (
        <div className="flex gap-x-2 border-b-2 border-foreground">
          <button
            onClick={() => handleTabChange("content")}
            className={cn(
              "px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] transition-colors",
              activeTab === "content"
                ? "bg-foreground text-background dark:bg-primary dark:text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            {t.course.content}
          </button>
          {!isPreviewMode && (
            <>
              <button
                onClick={() => handleTabChange("notes")}
                className={cn(
                  "px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] transition-colors",
                  activeTab === "notes"
                    ? "bg-foreground text-background dark:bg-primary dark:text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {t.nav.notes}
              </button>
              <button
                onClick={() => handleTabChange("discussion")}
                className={cn(
                  "px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] transition-colors",
                  activeTab === "discussion"
                    ? "bg-foreground text-background dark:bg-primary dark:text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {t.course.discussion}
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === "content" || isPreviewMode ? (
        <>
          <Card className="overflow-hidden">
            <div className="relative w-full">
              {videoUrl && (
                <div className="aspect-video">
                  <video
                    className="w-full h-full"
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
                    title={t.course.videoFrameTitle(title)}
                    className="h-full w-full border-0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}

              {pdfUrl && (
                <>
                  <div className="flex justify-end border-b-2 border-foreground p-3">
                    <Button asChild variant="outline" size="sm" className="min-h-11">
                      <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                        {t.course.openPdf}
                      </a>
                    </Button>
                  </div>
                  <div className="relative min-h-[500px] w-full bg-secondary">
                    <div className="absolute inset-0">
                      <iframe
                        src={`${pdfUrl}#toolbar=0`}
                        title={t.course.pdfFrameTitle(title)}
                        className="w-full h-full border-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {richContent && (
                <div className="p-4 sm:p-6">
                  <Preview value={richContent} className="lesson-content" />
                </div>
              )}

              {!videoUrl && !youtubeUrl && !pdfUrl && !richContent && (
                <div
                  className="dl-stamped flex h-[400px] flex-col items-center justify-center bg-secondary"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div
                        className="flex h-20 w-20 items-center justify-center border-2 border-foreground bg-card"
                      >
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      </div>
                      <div
                        className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center border-2 border-foreground bg-primary"
                      >
                        <FileText className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-bold">
                        {t.course.loadingContent}
                      </h3>
                      <p className="text-sm font-semibold text-muted-foreground">
                        {t.course.preparingLesson}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </Card>

          {hasWalletSimulator && isAuthenticated && !isPreviewMode && (
            <WalletSimulator onLessonComplete={completeOnEnd ? () => completionRef.current?.complete() : undefined} />
          )}

          {isAuthenticated &&
            !isPreviewMode &&
            attachments &&
            attachments.length > 0 && (
              <ResourcesCard attachments={attachments} />
            )}

          {isAuthenticated && !isPreviewMode && (
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="notes"
                    className="flex items-center gap-x-2 text-sm font-bold uppercase tracking-[0.08em]"
                  >
                    <FileText className="h-4 w-4" />
                    {t.course.digitalNotebook}
                  </Label>
                  <div className="mt-2">
                    <Editor
                      value={notes}
                      onChange={(value) => {
                        setNotes(value);
                      }}
                      height="300px"
                      className="rounded-[2px] border-2 border-foreground"
                      style={{
                        minHeight: "200px",
                        maxHeight: "400px",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isLoading
                      ? t.course.loadingNotes
                      : isSavingNotes
                        ? t.course.savingNotes
                        : t.course.autosaveNotes}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSaveNotes}
                    className="text-sm"
                    disabled={isSavingNotes}
                  >
                    {isSavingNotes ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t.course.savingNotes}
                      </>
                    ) : (
                      t.course.saveNotes
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
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-2xl">
                    {t.course.continuePromptTitle}
                  </h3>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {t.course.continuePromptDescription}
                  </p>
                </div>
                <Button
                  asChild
                  className=""
                >
                  <Link href="/sign-in">{t.course.startHere}</Link>
                </Button>
              </div>
            </Card>
          )}
        </>
      ) : activeTab === "notes" ? (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-x-2 text-sm font-bold uppercase tracking-[0.08em]">
                <FileText className="h-4 w-4" />
                {t.course.digitalNotebook}
              </Label>
              <div className="mt-2">
                {notes ? (
                  <div>
                    {typeof notes === 'string' && notes.startsWith('{"root":') ? (
                      <div className="text-sm">
                        {JSON.parse(notes).root?.children?.[0]?.children?.[0]?.text || t.common.noContent}
                      </div>
                    ) : (
                      <Preview value={notes} />
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-muted-foreground">
                    {t.course.noNotes}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-bold uppercase tracking-[0.08em]">
                {t.course.shareIdeas}
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
