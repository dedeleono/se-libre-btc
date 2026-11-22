"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ResourcesCard } from "./resources-card";
import { Preview } from "@/components/preview";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CompletionButton, CompletionButtonRef } from "./completion-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiscussionSection } from "./discussion-section";
import { LessonNotebook } from "./lesson-notebook";
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

const tabTriggerClass =
  "min-h-11 flex-1 rounded-none border-0 px-4 text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground shadow-none sm:flex-none data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground";

const sectionHeadingClass =
  "font-[family-name:var(--font-body)] text-sm font-bold uppercase leading-normal tracking-[0.08em]";

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
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "discussion">("content");
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

  const onVideoEnd = () => {
    if (completeOnEnd && completionRef.current && isAuthenticated && !isPreviewMode) {
      completionRef.current.complete();
    }
  };

  const lessonBody = (
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
        <Card className="p-4 sm:p-6">
          <LessonNotebook key={chapterId} courseId={courseId} chapterId={chapterId} />
        </Card>
      )}

      {completeOnEnd && isAuthenticated && !isPreviewMode && (
        <div className="flex justify-end">
          <CompletionButton
            ref={completionRef}
            courseId={courseId}
            chapterId={chapterId}
            nextChapterId={nextChapterId}
          />
        </div>
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
  );

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

      {isAuthenticated ? (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "content" | "discussion")}
          className="gap-4"
        >
          <TabsList className="h-auto w-full justify-start gap-2 rounded-none border-b-2 border-foreground bg-transparent p-0">
            <TabsTrigger value="content" className={tabTriggerClass}>
              {t.course.content}
            </TabsTrigger>
            {!isPreviewMode && (
              <TabsTrigger value="discussion" className={tabTriggerClass}>
                {t.course.discussion}
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent
            value="content"
            forceMount
            className="flex flex-col gap-y-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground data-[state=inactive]:hidden"
          >
            {lessonBody}
          </TabsContent>
          {!isPreviewMode && (
            <TabsContent
              value="discussion"
              className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              <Card className="p-4 sm:p-6">
                <h2 className={sectionHeadingClass}>{t.course.shareIdeas}</h2>
                <div className="mt-4">
                  <DiscussionSection chapterId={chapterId} currentUser={currentUser!} />
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      ) : (
        lessonBody
      )}
    </div>
  );
};
