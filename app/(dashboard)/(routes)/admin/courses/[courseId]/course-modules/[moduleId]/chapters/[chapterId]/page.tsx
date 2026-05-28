import { IconBadge } from "@/components/icon-badge";
import { Banner } from "@/components/banner";
import { prisma } from "@/lib/db";
import { ArrowLeft, Eye, LayoutDashboard, VideoIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChapterTitleForm } from "./_components/chapter-title-form";
import { ChapterDescriptionForm } from "./_components/chapter-description-form";
import { ChapterIntroForm } from "./_components/chapter-intro-form";
import { ChapterVideoForm } from "./_components/chapter-video-form";
import { Separator } from "@/components/ui/separator";
import { AttachmentForm } from "./_components/chapter-attachment-form";
import { ChapterActions } from "./_components/chapter-actions";
import { ChapterType } from "@prisma/client";
import { ChapterContentForm } from "./_components/chapter-content-form";
import { QuizBuilder } from "./_components/quiz-builder";


export default async function ChapterIdPage({
  params,
}: {
  params: { courseId: string; moduleId: string; chapterId: string };
}) {
  const moduleChapter = await prisma.chapter.findFirst({
    where: {
      id: params.chapterId,
      moduleId: params.moduleId,
    },
    include: {
      attachments: true,
      quiz: {
        include: {
          questions: {
            include: { options: { orderBy: { position: "asc" } } },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  if (!moduleChapter)
    return redirect(
      `/admin/courses/${params.courseId}/course-modules/${params.moduleId}`
    );

    const getRequiredFields = (type: ChapterType) => {
      switch (type) {
        case "QUIZ":
          return [moduleChapter.title];
        default: // LESSON
          return [
            moduleChapter.title,
            moduleChapter.description,
            moduleChapter.videoUrl || moduleChapter.youtubeUrl || moduleChapter.pdfUrl || moduleChapter.richContent,
          ];
      }
    };
    const requiredFields = getRequiredFields(moduleChapter.type);
  // const requiredFields = [
  //   moduleChapter.title,
  //   moduleChapter.description,
  //   moduleChapter.videoUrl || moduleChapter.pdfUrl, 
  // ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean)

  const renderBuilder = () => {
    return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
            <div className="space-y-4 ">
              <div>
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={LayoutDashboard} />
                  <h2 className="text-xl">Edita la lección</h2>
                </div>
                <ChapterTitleForm
                  initialData={moduleChapter}
                  courseId={params.courseId}
                  moduleId={params.moduleId}
                  chapterId={params.chapterId}
                />
                <ChapterDescriptionForm
                  initialData={moduleChapter}
                  courseId={params.courseId}
                  moduleId={params.moduleId}
                  chapterId={params.chapterId}
                />
              </div>
              <div>
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={Eye} />
                  <h2 className="text-xl">Configuración de Acceso</h2>
                </div>
                <ChapterIntroForm
                  initialData={moduleChapter}
                  courseId={params.courseId}
                  moduleId={params.moduleId}
                  chapterId={params.chapterId}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={VideoIcon} />
                <h2 className="text-xl">Agregar Contenido</h2>
              </div>
              {moduleChapter.type === ChapterType.QUIZ ? (
                <QuizBuilder chapterId={params.chapterId} quiz={moduleChapter.quiz} />
              ) : (
                <>
                  <ChapterContentForm
                    initialData={moduleChapter}
                    courseId={params.courseId}
                    moduleId={params.moduleId}
                    chapterId={params.chapterId}
                  />
                  <Separator orientation="horizontal" className="my-5" />
                  <AttachmentForm
                    initialData={moduleChapter}
                    courseId={params.courseId}
                    moduleId={params.moduleId}
                    chapterId={params.chapterId}
                  />
                </>
              )}
            </div>
          </div>
        );
  };

  return (
    <>
      {!moduleChapter.isPublished && (
        <Banner
          variant="warning"
          label="Esta lección aún no se ha publicado. No será visible bajo ninguna circunstancia."
        />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <Link
              href={`/admin/courses/${params.courseId}/course-modules/${params.moduleId}`}
              className="flex items-center text-sm hover:opacity-75 transition mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ir atrás
            </Link>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-y-2">
                <h1 className="font-medium text-2xl">
                  Creación y Edición de Lección
                </h1>
                <span className="text-sm text-slate-700">
                  Completa todos los campos {completionText}
                </span>
              </div>
              <ChapterActions
                disabled={!isComplete}
                courseId={params.courseId}
                moduleId={params.moduleId}
                chapterId={params.chapterId}
                isPublished={moduleChapter.isPublished}
              />
            </div>
          </div>
        </div>
       
        {renderBuilder()}
      </div>
    </>
  );
};

export const revalidate = 0;
