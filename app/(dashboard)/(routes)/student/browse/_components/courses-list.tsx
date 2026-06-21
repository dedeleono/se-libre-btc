import { CourseCard } from "@/components/course-card";
import { Category, Course } from "@prisma/client";

type CourseWithProgressWithCategory = Course & {
  category?: Category | null;
  chapters?: { id: string }[];
  isEnrolled?: boolean;
  progress?: number | null;
};

interface CoursesListProps {
  items: CourseWithProgressWithCategory[];
}

export const CoursesList = ({ items }: CoursesListProps) => {
  return (
    <div className="w-full">
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <CourseCard
            key={item.id}
            id={item.id}
            title={item.title}
            imageUrl={item.imageUrl}
            chaptersLength={item.chapters?.length ?? 0}
            isEnrolled={Boolean(item.isEnrolled)}
            progress={item.progress ?? null}
            category={item.category?.name ?? null}
            firstChapterId={item.chapters?.[0]?.id ?? null}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center text-sm text-muted-foreground">
          No se encontraron cursos
        </div>
      )}
    </div>
  );
};
