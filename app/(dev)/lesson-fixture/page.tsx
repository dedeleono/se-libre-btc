// TEMPORARY: deleted before the PR (plan 006, Step 10).
import { notFound } from "next/navigation";
import { ContentViewer } from "@/app/(course)/courses/[courseId]/chapters/[chapterId]/_components/content-viewer";
import { LESSON_FIXTURES, type LessonFixtureId } from "./fixtures";

export default async function LessonFixturePage(props: {
  searchParams: Promise<{ fixture?: string; mode?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { fixture = "long-description", mode = "preview" } = await props.searchParams;
  const data = LESSON_FIXTURES[fixture as LessonFixtureId];
  if (!data) notFound();
  const enrolled = mode === "enrolled";
  return (
    <div className="dl-app h-full w-full max-w-full overflow-x-hidden">
      <div aria-hidden className="fixed inset-y-0 left-0 hidden w-80 border-r-2 border-foreground bg-card md:block" />
      <main className="dl-stamped h-full w-full max-w-full pt-16 md:pl-80">
        <div className="flex h-full flex-col">
          <ContentViewer
            title={data.title}
            description={data.description}
            richContent={data.richContent}
            courseId="fixture-course"
            chapterId="fixture-chapter"
            completeOnEnd={false}
            isAuthenticated={enrolled}
            lockType={enrolled ? undefined : "intro"}
            attachments={[]}
            isLocked={false}
          />
        </div>
      </main>
    </div>
  );
}
