import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { Categories } from "./_components/categories";
import { SearchInput } from "@/components/search-input";
import { getCourses } from "@/actions/get-courses";
import { auth } from "@/lib/auth";
import { CoursesList } from "./_components/courses-list";
import { Category, Course } from "@prisma/client";
import ClientOnly from "@/components/client-only";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

interface BrowsePageProps {
  searchParams: Promise<{ title: string; categoryId: string }>;
}

const BrowsePage = async (props: BrowsePageProps) => {
  const searchParams = await props.searchParams;
  const session = await auth();
  const userId = session?.user?.id;

  const categories: Category[] = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const courses: Course[] = await getCourses({
    userId: userId as string,
    ...searchParams,
  });

  return (
    <ClientOnly>
      <div className="h-full p-6">
        <div className="pt-3 pb-6 md:hidden md:mb-0 block">
          <Suspense fallback={<div>Cargando búsqueda...</div>}>
            <SearchInput />
          </Suspense>
        </div>
        <div className="mb-6">
          <Suspense fallback={<div>Cargando categorías...</div>}>
            <Categories items={categories} />
          </Suspense>
        </div>

        <Suspense fallback={<div>Cargando cursos...</div>}>
          <CoursesList items={courses} />
        </Suspense>
      </div>
    </ClientOnly>
  );
};

export default BrowsePage;
