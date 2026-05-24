import { Course, User } from "@prisma/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CourseCardProps {
  course: Course & {
    teacher: User | null;
    modules: any[];
  };
}

export const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="group hover:shadow-md transition overflow-hidden">
        <div className="relative aspect-video">
          {course.imageUrl ? (
            <Image
              alt={course.title}
              src={course.imageUrl}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-slate-500" />
            </div>
          )}
        </div>
        <CardHeader className="font-semibold truncate">
          {course.title}
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {course.description || "Sin descripción"}
        </CardContent>
        <CardFooter className="text-sm flex items-center gap-x-2">
          <div className="flex items-center gap-x-2 text-slate-500">
            <div className="w-4 h-4">
              {course.teacher?.image && (
                <Image
                  src={course.teacher.image}
                  alt={course.teacher.name || ""}
                  className="rounded-full"
                  height={16}
                  width={16}
                />
              )}
            </div>
            <span>{course.teacher?.name || "Sin profesor"}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
