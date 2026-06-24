"use client";

import * as z from "zod";
import axios from "axios";
// @todo replace video player
import { Chapter } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Pencil, PlusCircle, Video } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { S3FileUpload, S3FileUploadRef } from "@/components/file-upload";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

interface ChapterVideoProps {
  initialData: Chapter
  courseId: string;
  moduleId: string;
  chapterId: string;
}

const formSchema = z.object({
  videoUrl: z.string().min(1),
});

export const ChapterVideoForm = ({
  initialData,
  courseId,
  moduleId,
  chapterId,
}: ChapterVideoProps) => {
  const { t } = useLocale();
  const fileUploadRef = useRef<S3FileUploadRef>(null);

  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(
        `/api/courses/${courseId}/course-modules/${moduleId}/chapters/${chapterId}`,
        values
      );
      toast.success(t.admin.videoUploaded);
      toggleEdit();
      fileUploadRef.current?.stopUpload();
      router.refresh();
    } catch (error) {
      toast.error(t.admin.videoUploadError);
      fileUploadRef.current?.stopUpload();
    }
  };

  return (
    <div className="mt-6 bg-muted rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        {t.admin.lessonVideo}
        <Button onClick={toggleEdit} variant="ghost" className="cursor-pointer">
          {isEditing && <>{t.common.cancel}</>}
          {!isEditing && !initialData.videoUrl && (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t.admin.addVideo}
            </>
          )}
          {!isEditing && initialData.videoUrl && (
            <>
              <Pencil className="w-4 h-4 mr-2" />
              {t.admin.changeVideo}
            </>
          )}
        </Button>
      </div>
      {!isEditing &&
        (!initialData.videoUrl ? (
          <div className="flex items-center justify-center h-60 bg-secondary rounded-md">
            <Video className="h-10 w-10 text-muted-foreground" />
          </div>
        ) : (
          <div className="relative aspect-video mt-2">
            <video controls className="w-full h-full rounded-sm">
              <source
                src={`${initialData.videoUrl}`}
                type="video/mp4"
              />
            </video>
          </div>
        ))}
      {isEditing && (
        <div>
          <S3FileUpload
            onUploadComplete={(url) => {
              if (url) {
                onSubmit({ videoUrl: url });
              }
            }}
            onUploadError={(error) => {
              toast.error(t.admin.videoUploadError);
            }}
            type="video"
            ref={fileUploadRef}
          />
          <div className="text-xs text-muted-foreground mt-4">
            {t.admin.uploadVideoForLesson}
          </div>
        </div>
      )}
      {initialData.videoUrl && !isEditing && (
        <div className="text-xs text-muted-foreground mt-2">
          {t.admin.videoProcessingHelp}
        </div>
      )}
    </div>
  );
};
