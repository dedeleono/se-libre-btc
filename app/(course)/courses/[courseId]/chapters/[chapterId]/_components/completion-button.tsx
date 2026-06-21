"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

interface CompletionButtonProps {
  courseId: string;
  chapterId: string;
  nextChapterId?: string;
}

export interface CompletionButtonRef {
  complete: () => Promise<void>;
}

export const CompletionButton = forwardRef<CompletionButtonRef, CompletionButtonProps>(
  ({ courseId, chapterId, nextChapterId }, ref) => {
    const { t } = useLocale();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const onComplete = async () => {
      try {
        setIsLoading(true);
        await axios.put(`/api/courses/${courseId}/chapters/${chapterId}/progress`);
        
        setIsCompleted(true);
        toast.success(t.course.lessonCompleted);
        
        // Force revalidation of the course data
        router.refresh();
        
        if (nextChapterId) {
          router.push(`/courses/${courseId}/chapters/${nextChapterId}`);
        } else {
          router.push(`/courses/${courseId}/complete`);
        }
      } catch (error) {
        toast.error(t.course.progressError);
      } finally {
        setIsLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      complete: onComplete
    }));

    if (isCompleted) {
      return (
        <Button
          onClick={() =>
            nextChapterId
              ? router.push(`/courses/${courseId}/chapters/${nextChapterId}`)
              : router.push(`/courses/${courseId}/complete`)
          }
          className="flex items-center gap-x-2"
        >
          {!nextChapterId ? (
            t.course.lastLesson
          ) : (
            <>
              {t.course.nextLesson}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      );
    }

    return (
      <Button
        onClick={onComplete}
        disabled={isLoading}
        className="flex items-center gap-x-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {t.course.markCompleted}
      </Button>
    );
  }
);

CompletionButton.displayName = "CompletionButton"; 
