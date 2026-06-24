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
import { useLocale } from "@/lib/i18n";

interface ImageFormProps {
  initialData: Course;
  courseId: string;
}

export const ImageForm = ({ initialData, courseId }: ImageFormProps) => {
  const { t } = useLocale();
  const fileUploadRef = useRef<S3FileUploadRef>(null);
  const formSchema = z.object({
    imageUrl: z.string().min(1, { message: t.admin.imageRequired }),
  });

  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, { imageUrl: values.imageUrl });
      toast.success(t.admin.imageUpdated);
      toggleEdit();
      fileUploadRef.current?.stopUpload();
      router.refresh();
    } catch (error) {
      toast.error(t.admin.imageUpdateError);
    }
  };

  return (
    <div className="mt-6 rounded-md border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">{t.admin.image}</h3>
          <p className="text-xs text-muted-foreground">{t.admin.imageHelp}</p>
        </div>
        <Button onClick={toggleEdit} variant="ghost" size="sm" className="shrink-0">
          {isEditing && <>{t.common.cancel}</>}
          {!isEditing && !initialData.imageUrl && (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t.admin.addImage}
            </>
          )}
          {!isEditing && initialData.imageUrl && (
            <>
              <Pencil className="w-4 h-4 mr-2" />
              {t.admin.changeImage}
            </>
          )}
        </Button>
      </div>
      {!isEditing &&
        (!initialData.imageUrl ? (
          <div className="mt-3 flex h-60 items-center justify-center rounded-md border border-dashed bg-muted">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
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
              toast.error(t.admin.imageUploadError);
            }}
            type="image"
          />
          <div className="text-xs text-muted-foreground mt-4">
            {t.admin.recommendedAspectRatio}
          </div>
        </div>
      )}
    </div>
  );
};
