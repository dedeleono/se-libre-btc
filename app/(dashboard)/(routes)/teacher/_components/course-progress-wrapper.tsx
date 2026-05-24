import { getCachedCoursesActivity } from "@/lib/actions";
import { CourseProgress } from "./course-progress";
import { CourseData } from "@/types/course-progress";

interface CourseProgressWrapperProps {
  userId: string;
}

export async function CourseProgressWrapper({ userId }: CourseProgressWrapperProps) {
  const rawData = await getCachedCoursesActivity(userId);
  
  // Ensure all promises are resolved
  const data: CourseData[] = await Promise.all(
    rawData.map(async (course) => ({
      ...course,
      completionRate: await course.completionRate
    }))
  );
  
  return <CourseProgress initialData={data} />;
} 