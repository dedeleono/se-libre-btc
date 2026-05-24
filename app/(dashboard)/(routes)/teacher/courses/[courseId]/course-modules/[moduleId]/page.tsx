import { IconBadge } from "@/components/icon-badge";
import { prisma } from "@/lib/db";
import { ArrowLeft, Calculator, LayoutDashboard, PaperclipIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ModuleTitleForm } from "./_components/module-title-form";
import { ModuleDescriptionForm } from "./_components/module-description-form";
import { ChaptersForm } from "./_components/chapters-form";
import { ModuleActions } from "./_components/modules-actions";
import { ModuleScoringForm } from "./_components/module-scoring-form";

const CourseModuleIdPage = async ({
  params,
}: {
  params: { courseId: string, moduleId: string };
}) => {

  const courseModule = await prisma.courseModule.findFirst({
    where: {
      id: params.moduleId,
      courseId: params.courseId
    },
    include: {
      chapters: {
        include: {
          assignments: true
        }
      }
    }
  });

  const chapters = courseModule?.chapters

  if (!courseModule) return redirect("/teacher");

  const requiredFields = [courseModule.title, courseModule.description];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;

  const completionText = `(${completedFields}/${totalFields})`;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="w-full">
          <Link
            href={`/teacher/courses/${params.courseId}/`}
            className="flex items-center text-sm hover:opacity-75 transition mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ir atrás
          </Link>
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-y-2">
              <h1 className="font-medium text-2xl">
                Creación y Edición de Módulo
              </h1>
              <span className="text-sm text-slate-700">
                Complete all fields {completionText}
              </span>
            </div>
            <ModuleActions
              courseId={params.courseId}
              moduleId={params.moduleId}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
        <div className="space-y-4 ">
          <div>
            <div className="flex items-center gap-x-2">
              <IconBadge icon={LayoutDashboard} />
              <h2 className="text-xl">Edita el módulo</h2>
            </div>
            <ModuleTitleForm
              initialData={courseModule}
              courseId={params.courseId}
              moduleId={params.moduleId}
            />
            <ModuleDescriptionForm
              initialData={courseModule}
              courseId={params.courseId}
              moduleId={params.moduleId}
            />
          </div>
          <div>
            <div className="flex items-center gap-x-2 mt-12">
              <IconBadge icon={Calculator} />
              <h2 className="text-xl">Puntuación</h2>
            </div>
            <ModuleScoringForm
              moduleId={params.moduleId}
              courseId={params.courseId}
              chapters={courseModule.chapters}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-x-2">
            <IconBadge icon={PaperclipIcon} />
            <h2 className="text-xl">Lecciones del Módulo</h2>
          </div>
          <ChaptersForm
            initialData={courseModule}
            courseId={params.courseId}
            moduleId={params.moduleId}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseModuleIdPage;
