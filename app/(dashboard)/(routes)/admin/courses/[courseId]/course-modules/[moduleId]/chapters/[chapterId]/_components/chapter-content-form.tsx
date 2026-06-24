"use client";

import * as z from "zod";
import axios from "axios";
import { Chapter } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Pencil, PlusCircle, File, Video, FileText } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { S3FileUpload } from "@/components/file-upload";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Editor } from "@/components/editor";
import { Preview } from "@/components/preview";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

interface ChapterContentFormProps {
  initialData: Chapter & {
    youtubeUrl?: string | null;
  };
  courseId: string;
  moduleId: string;
  chapterId: string;
}

const formSchema = z.object({
  videoUrl: z.string().optional(),
  youtubeUrl: z.string().nullable().optional(),
  pdfUrl: z.string().optional(),
  richContent: z.string().optional(),
}).refine((data) => {
  return Boolean(data.videoUrl || data.youtubeUrl || data.pdfUrl || data.richContent);
}, {
  message: "You must provide either a video, YouTube URL, PDF, or text content"
});

export const ChapterContentForm = ({
  initialData,
  courseId,
  moduleId,
  chapterId,
}: ChapterContentFormProps) => {
  const { t } = useLocale();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [contentType, setContentType] = useState<"video" | "youtube" | "pdf" | "richText">(
    initialData.youtubeUrl 
      ? "youtube"
      : initialData.videoUrl 
      ? "video" 
      : initialData.pdfUrl 
      ? "pdf" 
      : "richText"
  );
  const [richContent, setRichContent] = useState(initialData.richContent || "");
  const [youtubeUrl, setYoutubeUrl] = useState(initialData.youtubeUrl || "");

  const toggleEdit = () => {
    if (!isEditing) {
      setRichContent(initialData.richContent || "");
      setYoutubeUrl(initialData.youtubeUrl || "");
    }
    setIsEditing((current) => !current);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const updatedValues = {
        videoUrl: contentType === "video" ? values.videoUrl : null,
        youtubeUrl: contentType === "youtube" ? values.youtubeUrl : null,
        pdfUrl: contentType === "pdf" ? values.pdfUrl : null,
        richContent: contentType === "richText" ? values.richContent : null,
      };

      await axios.patch(
        `/api/courses/${courseId}/course-modules/${moduleId}/chapters/${chapterId}`,
        updatedValues
      );
      toggleEdit();
      router.refresh();
    } catch (error) {
      console.error("Error updating chapter content:", error);
      toast.error(t.admin.contentUpdateError);
    }
  };

  return (
    <div className="mt-6 rounded-md border bg-card p-4 shadow-sm md:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">{t.admin.lessonContent}</h3>
          <p className="text-xs text-muted-foreground">
            {t.admin.lessonContentHelp}
          </p>
        </div>
        <Button
          onClick={toggleEdit}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          {isEditing && (
            <span className="flex items-center text-slate-600">{t.common.cancel}</span>
          )}
          {!isEditing &&
            !initialData.videoUrl &&
            !initialData.pdfUrl &&
            !initialData.richContent &&
            !initialData.youtubeUrl && (
              <span className="flex items-center text-indigo-600">
                <PlusCircle className="h-4 w-4 mr-2" />
                {t.admin.addContent}
              </span>
            )}
          {!isEditing &&
            (initialData.videoUrl ||
              initialData.pdfUrl ||
              initialData.richContent ||
              initialData.youtubeUrl) && (
              <span className="flex items-center text-slate-600">
                <Pencil className="h-4 w-4 mr-2" />
                {t.common.edit}
              </span>
            )}
        </Button>
      </div>

      {!isEditing && (
        <div>
          {!initialData.videoUrl &&
          !initialData.pdfUrl &&
          !initialData.youtubeUrl &&
          !initialData.richContent ? (
            <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md border-2 border-dashed border-slate-300 transition-colors hover:bg-slate-300/50">
              <div className="text-center">
                <File className="h-12 w-12 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">
                  No hay contenido agregado
                </p>
              </div>
            </div>
          ) : initialData.youtubeUrl ? (
            <div className="relative aspect-video mt-2 rounded-md overflow-hidden shadow-md">
              <iframe
                src={initialData.youtubeUrl}
                className="w-full h-full"
                allowFullScreen
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          ) : initialData.videoUrl ? (
            <div className="relative aspect-video mt-2 rounded-md overflow-hidden shadow-md">
              <video controls className="w-full">
                <source src={initialData.videoUrl} type="video/mp4" />
              </video>
            </div>
          ) : initialData.pdfUrl ? (
            <div className="relative aspect-[3/4] mt-2 rounded-md overflow-hidden shadow-md">
              <iframe
                src={`${initialData.pdfUrl}#toolbar=0`}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="prose max-w-none">
              <Preview value={initialData.richContent || ""} />
            </div>
          )}
        </div>
      )}

      {isEditing && (
        <div className="space-y-6">
          <RadioGroup
            defaultValue={contentType}
            onValueChange={(value) =>
              setContentType(value as "video" | "youtube" | "pdf" | "richText")
            }
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            <div
              className={cn(
                "flex min-h-12 items-center gap-2 rounded-md border p-3 transition-colors",
                contentType === "video"
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-background hover:bg-muted/60"
              )}
            >
              <RadioGroupItem value="video" id="video" />
              <Label
                htmlFor="video"
                className="flex items-center cursor-pointer"
              >
                <Video className="h-4 w-4 mr-2 text-slate-600" />
                Video
              </Label>
            </div>
            <div
              className={cn(
                "flex min-h-12 items-center gap-2 rounded-md border p-3 transition-colors",
                contentType === "youtube"
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-background hover:bg-muted/60"
              )}
            >
              <RadioGroupItem value="youtube" id="youtube" />
              <Label htmlFor="youtube" className="flex items-center cursor-pointer">
                <Video className="h-4 w-4 mr-2 text-slate-600" />
                YouTube
              </Label>
            </div>
            <div
              className={cn(
                "flex min-h-12 items-center gap-2 rounded-md border p-3 transition-colors",
                contentType === "pdf"
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-background hover:bg-muted/60"
              )}
            >
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf" className="flex items-center cursor-pointer">
                <File className="h-4 w-4 mr-2 text-slate-600" />
                PDF
              </Label>
            </div>
            <div
              className={cn(
                "flex min-h-12 items-center gap-2 rounded-md border p-3 transition-colors",
                contentType === "richText"
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-background hover:bg-muted/60"
              )}
            >
              <RadioGroupItem value="richText" id="richText" />
              <Label
                htmlFor="richText"
                className="flex items-center cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2 text-slate-600" />
                Text
              </Label>
            </div>
          </RadioGroup>

          {isEditing && contentType === "video" && (
            <AnimatePresence mode="wait">
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mt-4 space-y-4"
              >
                <div className="space-y-4">
                  <div>
                    <Label>{t.admin.addVideo}</Label>
                    <S3FileUpload
                      onUploadComplete={(url) => {
                        if (url) {
                          onSubmit({ videoUrl: url });
                        }
                      }}
                      onUploadError={(error) => {
                        console.error("Upload error:", error);
                        toast.error(t.admin.videoUploadError);
                      }}
                      type="video"
                      acceptedFileTypes={["video/mp4"]}
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {isEditing && contentType === "pdf" && (
            <AnimatePresence mode="wait">
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mt-4"
              >
                <S3FileUpload
                  onUploadComplete={(url) => {
                    if (url) {
                      onSubmit({ pdfUrl: url });
                    }
                  }}
                  onUploadError={(error) => {
                    console.error("Upload error:", error);
                  }}
                  type="document"
                  acceptedFileTypes={["application/pdf"]}
                />
              </motion.div>
            </AnimatePresence>
          )}

          {isEditing && contentType === "richText" && (
            <AnimatePresence mode="wait">
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: 0.4,
                  opacity: { duration: 0.3 },
                  y: { 
                    type: "spring",
                    damping: 20,
                    stiffness: 200
                  }
                }}
                className="mt-4 space-y-4"
              >
                <Editor
                  value={richContent}
                  onChange={(value) => {
                    setRichContent(value);
                  }}
                  height="600px"
                  className="border border-gray-200 rounded-lg"
                  style={{ 
                    minHeight: "400px",
                    maxHeight: "80vh"
                  }}
                />
                <div className="flex items-center justify-end gap-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => onSubmit({ richContent: richContent })}
                    type="button"
                  >
                    Save changes
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Use the editor above to create formatted content for your lesson
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {isEditing && contentType === "youtube" && (
            <AnimatePresence mode="wait">
              <motion.div
                key="youtube"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mt-4 space-y-4"
              >
                <div className="space-y-2">
                  <Label>YouTube URL</Label>
                  <div className="flex gap-x-2">
                    <Input
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={async () => {
                        const toastId = toast.loading(t.admin.youtubeProcessing);
                        try {
                          const response = await axios.post("/api/s3/yt", {
                            youtubeUrl,
                            chapterId
                          });
                          
                          if (response.data.url) {
                            await onSubmit({ youtubeUrl: response.data.url });
                            toast.success(t.admin.youtubeAdded, {
                              id: toastId
                            });
                          }
                        } catch (error) {
                          console.error("Error procesando URL de YouTube:", error);
                          toast.error(t.admin.youtubeProcessError, {
                            id: toastId
                          });
                        }
                      }}
                      disabled={!youtubeUrl}
                    >
                      {t.admin.add}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Asegúrate de tener permisos para usar este video
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
};
