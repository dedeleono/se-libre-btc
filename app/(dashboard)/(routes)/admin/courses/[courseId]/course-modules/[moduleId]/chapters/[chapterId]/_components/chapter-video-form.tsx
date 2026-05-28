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
      toast.success("Vídeo cargado");
      toggleEdit();
      fileUploadRef.current?.stopUpload();
      router.refresh();
    } catch (error) {
      toast.error("Error al subir vídeo");
      fileUploadRef.current?.stopUpload();
    }
  };

  return (
    <div className="mt-6 bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Vídeo de la lección
        <Button onClick={toggleEdit} variant="ghost" className="cursor-pointer">
          {isEditing && <>Cancelar</>}
          {!isEditing && !initialData.videoUrl && (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              Agregar vídeo
            </>
          )}
          {!isEditing && initialData.videoUrl && (
            <>
              <Pencil className="w-4 h-4 mr-2" />
              Cambiar vídeo
            </>
          )}
        </Button>
      </div>
      {!isEditing &&
        (!initialData.videoUrl ? (
          <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md">
            <Video className="h-10 w-10 text-slate-500" />
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
              toast.error("Error al subir vídeo");
            }}
            type="video"
            ref={fileUploadRef}
          />
          <div className="text-xs text-muted-foreground mt-4">
            Subir vídeo para esta lección
          </div>
        </div>
      )}
      {initialData.videoUrl && !isEditing && (
        <div className="text-xs text-muted-foreground mt-2">
          Los videos pueden tomar unos minutos en procesar. Refresca la página
          si tu vídeo no aparece.
        </div>
      )}
    </div>
  );
};
