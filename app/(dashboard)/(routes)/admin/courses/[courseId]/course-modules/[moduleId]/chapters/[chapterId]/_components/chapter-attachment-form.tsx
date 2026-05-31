"use client";

import * as z from "zod";
import axios from "axios";
import { Attachment, Chapter } from "@prisma/client";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { File, ImageIcon, Loader2, Pencil, PlusCircle, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { S3FileUpload } from "@/components/file-upload";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

interface AttachmentFormProps {
  initialData: Chapter & {attachments: Attachment[]};
  courseId: string;
  moduleId: string;
  chapterId: string;
}

const formSchema = z.object({
  url: z.string().min(1),
});

export const AttachmentForm = ({ initialData, courseId, moduleId, chapterId }: AttachmentFormProps) => {
  const { t } = useLocale();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/courses/${courseId}/course-modules/${moduleId}/chapters/${chapterId}/attachments`, values);
      toast.success(t.admin.fileUploaded);
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error(t.forms.uploadError);
    }
  };

  const onDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await axios.delete(
        `/api/courses/${courseId}/course-modules/${moduleId}/chapters/${chapterId}/attachments/${id}`
      );
      toast.success(t.admin.fileDeleted);
      router.refresh();
    } catch {
      toast.error(t.admin.fileDeleteError);
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-6 bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        {t.course.resources}
        <Button onClick={toggleEdit} variant="ghost" className="cursor-pointer">
          {isEditing && <>{t.common.cancel}</>}
          {!isEditing && (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t.admin.addFile}
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <>
          {initialData.attachments.length === 0 && (
            <p className="text-sm mt-2 text-slate-500 italic">
              {t.admin.noFiles}
            </p>
          )}
          {initialData.attachments.length > 0 && (
            <>
              <div className="space-y-2">
                {initialData.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center p-3 w-full bg-sky-100 border-sky-200 border text-sky-700 rounded-md justify-between"
                  >
                    <File className="h-4 w-4 mr-2 flex-shrink-0" />
                    <p className="text-xs line-clamp-1">{attachment.name}</p>
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
              // TODO: Add error handling (e.g., show a toast)
            }}
            type="document"
          />
          <div className="text-xs text-muted-foreground mt-4">
            {t.forms.addFileForStudents}
          </div>
        </div>
      )}
    </div>
  );
};
