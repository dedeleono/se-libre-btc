"use client";

import * as z from "zod";
import axios from "axios";
import { Attachment, Course } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { File, Loader2, PlusCircle, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { S3FileUpload } from "@/components/file-upload";
import { toast } from "sonner";

interface AttachmentFormProps {
  initialData: Course & {attachments: Attachment[]};
  courseId: string;
}

const formSchema = z.object({
  url: z.string().min(1),
});

export const AttachmentForm = ({ initialData, courseId }: AttachmentFormProps) => {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/courses/${courseId}/attachments`, values);
      toast.success("Archivo agregado");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Algo salió mal");
    }
  };

  const onDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await axios.delete(`/api/courses/${courseId}/attachments/${id}`);
      toast.success("Archivo eliminado");
      router.refresh();
    } catch {
      toast.error("Algo salió mal");
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-6 rounded-md border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">Recursos</h3>
          <p className="text-xs text-muted-foreground">Archivos descargables para estudiantes.</p>
        </div>
        <Button onClick={toggleEdit} variant="ghost" size="sm" className="shrink-0">
          {isEditing && <>Cancelar</>}
          {!isEditing && (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              Agregar archivo
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <>
          {initialData.attachments.length === 0 && (
            <p className="text-sm mt-2 text-slate-500 italic">
              No hay archivos aún
            </p>
          )}
          {initialData.attachments.length > 0 && (
            <>
              <div className="space-y-2">
                {initialData.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between rounded-md border bg-muted/40 p-3 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <p className="truncate text-xs">{attachment.name}</p>
                    </div>
                    {deletingId === attachment.id && (
                      <div>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                    {deletingId !== attachment.id && (
                      <button
                        onClick={() => onDelete(attachment.id)}
                        className="ml-2 hover:opacity-50 transition bg-transparent text-red-500 border-none shadow-none"
                      >
                        <X className="h-4 w-4 " />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
      {isEditing && (
        <div>
          <S3FileUpload
            onUploadComplete={(url) => {
              if (url) {
                onSubmit({ url: url });
              }
            }}
            onUploadError={(error) => {
              console.error("Upload error:", error);
              toast.error("Error al subir archivo");
            }}
            type="document"
          />
          <div className="text-xs text-muted-foreground mt-4">
            Agrega archivos que tus estudiantes puedan necesitar
          </div>
        </div>
      )}
    </div>
  );
};
