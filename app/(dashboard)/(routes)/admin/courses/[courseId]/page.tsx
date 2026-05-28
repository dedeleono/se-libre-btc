import {prisma} from "@/lib/db"
import { redirect } from "next/navigation";
import { IconBadge } from "@/components/icon-badge";
import { File, LayoutDashboard, ListChecks } from "lucide-react";
import { TitleForm } from "./_components/title-form";
import { DescriptionForm } from "./_components/description-form";
import { ImageForm } from "./_components/image-form";
import { CategoryForm } from "./_components/category-form";
import { AttachmentForm } from "./_components/attachment-form";
import { ModulesForm } from "./_components/modules-form";
import { Banner } from "@/components/banner";
import { CourseActions } from "./_components/course-actions";
// import { auth } from "@/lib/auth";

const CourseIdPage = async ({ params }: { params: { courseId: string } }) => {

  // const session = await auth()

  const course = await prisma.course.findUnique({
    where: {
      id: params.courseId,
      // userId: session?.user?.id - so that only the owner fetches it
    },
    include: {
      attachments: {
        orderBy: {
          createdAt: "desc",
        },
      },
      courseCategory: {
        include: {
          category: true,
        },
      },
      modules: {
        orderBy: {
          position: "asc",
        },
        include: {
          chapters: {
            orderBy: {
              position: "asc",
            },
          },
        },
      },
    },
  });

  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  if (!course) {
    return redirect("/sign-in");
  }

  // Cross-reference courseCategory with categories
   const courseCategories = course.courseCategory

   const initialCategoryData = {
     categoryIds: courseCategories.map((cat) => cat.categoryId),
   };

   const options = categories.map((category) => ({
     label: category.name,
     value: category.id,
   }));

  const requiredFields = [
    course.title,
    // course.description,
    // course.imageUrl,
    // course.courseCategory,
    course.modules
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;

  const completionText = `${completedFields} / ${totalFields}`;

  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!course.isPublished && (
        <Banner
          variant="warning"
          label="Este curso aún no se ha publicado. No será visible a los estudiantes."
        />
      )}
      <div className="p-6 ">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-2">
            <h1 className="text-2xl font-medium">Configuración de Curso</h1>
            <span className="text-sm text-slate-700">
              Campos completados {completionText}
            </span>
          </div>
          <CourseActions
            disabled={!isComplete}
            courseId={params.courseId}
            isPublished={course.isPublished}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          <div>
            <div className="flex items-center gap-x-2">
              <IconBadge icon={LayoutDashboard} />
              <h2 className="text-xl">Edita tu Curso</h2>
            </div>
            <TitleForm initialData={course} courseId={params.courseId} />
            <DescriptionForm initialData={course} courseId={params.courseId} />
            <ImageForm initialData={course} courseId={params.courseId} />
            <CategoryForm
              initialData={{ ...course, categories: courseCategories }}
              courseId={params.courseId}
              options={options}
            />
          </div>
          <div className="space-y-6">
            <div className="">
              <div className="flex items-center gap-x-2">
                <IconBadge icon={ListChecks} />
                <h2 className="text-xl">Modúlos del Curso</h2>
              </div>
              <ModulesForm initialData={course} courseId={params.courseId} />
            </div>
            <div className="">
              <div className="flex items-center gap-x-2">
                <IconBadge icon={File} />
                <h2 className="text-xl">Recursos & Archivos</h2>
              </div>
              <AttachmentForm initialData={course} courseId={params.courseId} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseIdPage;
