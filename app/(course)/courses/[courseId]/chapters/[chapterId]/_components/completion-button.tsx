"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

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
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const onComplete = async () => {
      try {
        setIsLoading(true);
        await axios.put(`/api/courses/${courseId}/chapters/${chapterId}/progress`);
        
        setIsCompleted(true);
        toast.success("¡Lección completada!");
        
        // Force revalidation of the course data
        router.refresh();
        
        if (nextChapterId) {
          router.push(`/courses/${courseId}/chapters/${nextChapterId}`);
        }
      } catch (error) {
        toast.error("Error al actualizar el progreso");
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
          onClick={() => nextChapterId && router.push(`/courses/${courseId}/chapters/${nextChapterId}`)}
          disabled={!nextChapterId}
          className="flex items-center gap-x-2"
        >
          {!nextChapterId ? (
            "Última lección"
          ) : (
            <>
              Siguiente lección
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
        Marcar como Completado
      </Button>
    );
  }
);

CompletionButton.displayName = "CompletionButton"; 