import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

interface LevelContentProps {
  level: any; // You can type this properly based on the prisma query
  isStudent: boolean;
}

export const LevelContent = ({ level, isStudent }: LevelContentProps) => {
  return (
    <div className="space-y-6 font-['Open_Sans']">
      <h2 className="text-xl font-bold dark:text-white/90">Cursos del Grado</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {level.levelCourses.map((levelCourse: any) => (
          <Card key={levelCourse.course.id} 
            className="overflow-hidden dark:bg-black/40 dark:border-white/[0.05]">
            <div className="aspect-video relative">
              <Image
                src={levelCourse.course.imageUrl || "/placeholder.svg"}
                alt={levelCourse.course.title}
                fill
                className="object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-1 dark:text-white/90">
                {levelCourse.course.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 dark:text-white/70">
                {levelCourse.course.description}
              </p>
              <div className="flex items-center gap-x-2">
                <Link
                  href={
                    isStudent
                      ? `/course/${levelCourse.course.id}`
                      : `/courses/preview/${levelCourse.course.id}?from=level&levelId=${level.id}`
                  }
                >
                  <Button>
                    {isStudent ? "Comenzar" : "Ver Curso"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
