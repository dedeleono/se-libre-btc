"use client";

import * as z from "zod";
import axios from "axios";
import { Course } from "@prisma/client";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { ImageIcon, Pencil, PlusCircle } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { S3FileUpload, S3FileUploadRef } from "@/components/file-upload";
import { toast } from "sonner";

interface ImageFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  imageUrl: z.string().min(1, { message: "Image is required" }),
});

export const ImageForm = ({ initialData, courseId }: ImageFormProps) => {
  const fileUploadRef = useRef<S3FileUploadRef>(null);

  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, { imageUrl: values.imageUrl });
      toast.success("Imagen actualizada");
      toggleEdit();
      fileUploadRef.current?.stopUpload();
      router.refresh();
    } catch (error) {
      toast.error("Error al actualizar imagen");
    }
  };

  return (
    <div className="mt-6 rounded-md border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">Imagen</h3>
          <p className="text-xs text-muted-foreground">Portada visible en catálogo y preview.</p>
        </div>
        <Button onClick={toggleEdit} variant="ghost" size="sm" className="shrink-0">
          {isEditing && <>Cancelar</>}
          {!isEditing && !initialData.imageUrl && (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              Agregar imagen
            </>
          )}
          {!isEditing && initialData.imageUrl && (
            <>
              <Pencil className="w-4 h-4 mr-2" />
              Cambiar imagen
            </>
          )}
        </Button>
      </div>
      {!isEditing &&
        (!initialData.imageUrl ? (
          <div className="mt-3 flex h-60 items-center justify-center rounded-md border border-dashed bg-muted">
            <ImageIcon className="h-10 w-10 text-slate-500" />
          </div>
        ) : (
          <div className="relative mt-3 aspect-video overflow-hidden rounded-md border">
            <Image
              alt=""
              fill
              className="object-cover"
              src={initialData.imageUrl}
            />
          </div>
        ))}
      {isEditing && (
        <div>
          <S3FileUpload
            onUploadComplete={(url) => {
              if (url) {
                onSubmit({ imageUrl: url });
              }
            }}
            onUploadError={(error) => {
              toast.error("Error al subir imagen");
            }}
            type="image"
          />
          <div className="text-xs text-muted-foreground mt-4">
            Relación de aspecto 16:9 recomendada
          </div>
        </div>
      )}
    </div>
  );
};
