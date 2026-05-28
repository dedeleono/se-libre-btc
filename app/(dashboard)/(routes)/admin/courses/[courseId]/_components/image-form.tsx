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
    <div className="mt-6 bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Imágen
        <Button onClick={toggleEdit} variant="ghost" className="cursor-pointer">
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
          <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md">
            <ImageIcon className="h-10 w-10 text-slate-500" />
          </div>
        ) : (
          <div className="relative aspect-video mt-2">
            <Image
              alt=""
              fill
              className="object-cover rounded-md shadow-sm border border-black/10"
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
