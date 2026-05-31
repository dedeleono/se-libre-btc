import Image from "next/image";
import Link from "next/link";
import { IconBadge } from "@/components/icon-badge";
import { BookOpen, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnrollmentButton } from "@/components/enrollment-button";

interface CourseCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  chaptersLength: number;
  isEnrolled: boolean;
  progress: number | null;
  category: string | null;
}

export const CourseCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  isEnrolled,
  progress,
  category,
}: CourseCardProps) => {
  return (
      <div className="group hover:shadow-sm transition overflow-hidden border rounded-md p-3 h-full w-full flex flex-col">
        <Link href={isEnrolled ? `/courses/${id}` : `/courses/preview/${id}`}>
        <div className="relative w-full aspect-video rounded-md overflow-hidden">
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
            )}
        </div>
        </Link>
        <div className="flex flex-col pt-2">
          <Link href={isEnrolled ? `/courses/${id}` : `/courses/preview/${id}`}>
            <div className="text-lg md:text-base font-medium group-hover:text-sky-700 transition line-clamp-2">
                {title}
            </div>
          </Link>
            <p className="text-muted-foreground text-xs">
                {category}
            </p>
            <div className="flex items-center my-3 text-sm md:text-xs">
                <div className="flex items-center gap-x-2 text-slate-500">
                    <IconBadge size="sm" icon={BookOpen}/>
                    <span>
                        {chaptersLength} {chaptersLength === 1 ? "Chapter" : "Chapters"}
                    </span>
                </div>
            </div>
            {isEnrolled && progress !== null && (
                <div className="flex items-center gap-x-2 text-sm md:text-xs">
                    <IconBadge size="sm" icon={CheckCircle}/>
                    <p>
                        {progress}%
                    </p>
                </div>
            )}
            <div className="mt-auto pt-3">
              {isEnrolled ? (
                <Button asChild className="w-full" size="sm">
                  <Link href={`/courses/${id}`}>Continue</Link>
                </Button>
              ) : (
                <EnrollmentButton
                  productId={id}
                  productType="course"
                  redirectTo={`/courses/${id}`}
                  className="w-full"
                  size="sm"
                >
                  Enroll for free
                </EnrollmentButton>
              )}
            </div>
        </div>
      </div>
  );
};
