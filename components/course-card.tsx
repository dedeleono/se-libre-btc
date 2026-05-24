import Image from "next/image";
import Link from "next/link";
import { IconBadge } from "@/components/icon-badge";
import { BookOpen, CheckCircle } from "lucide-react";

interface CourseCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  chaptersLength: number;
  progress: number | null;
  category: string | null;
}

export const CourseCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  progress,
  category,
}: CourseCardProps) => {
  return (
    <Link href={`/courses/${id}`}>
      <div className="group hover:shadow-sm transition overflow-hidden border rounded-md p-3 h-full w-full">
        <div className="relative w-full aspect-video rounded-md overflow-hidden">
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
          )}
        </div>
        <div className="flex flex-col pt-2">
            <div className="text-lg md:text-base font-medium group-hover:text-sky-700 transition line-clamp-2">
                {title}
            </div>
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
            {progress !== null && (
                <div className="flex items-center gap-x-2 text-sm md:text-xs">
                    <IconBadge size="sm" icon={CheckCircle}/>
                    <p>
                        {progress}%
                    </p>
                </div>
            )}
        </div>
      </div>
    </Link>
  );
};
