// Dev-only notes, tabs, resources and sidebar fixture for `yarn check:lesson-layout`.
// The harness stubs /api/notes and the discussions API. Returns 404 in production.
import type { User } from "@prisma/client";
import { ContentViewer } from "@/app/(course)/courses/[courseId]/chapters/[chapterId]/_components/content-viewer";
import { CourseSidebarItem } from "@/app/(course)/courses/[courseId]/_components/course-sidebar-item";
import { devFixtureOnly } from "@/lib/dev-fixture";
import { LESSON_FIXTURES } from "../../../../fixtures";

const user = { id: "fixture-user", name: "Ana", email: "ana@example.com", image: null } as unknown as User;

export default async function LessonNotesFixturePage(props: { params: Promise<{ courseId: string; chapterId: string }> }) {
  devFixtureOnly();
  const { courseId, chapterId } = await props.params;
  const lesson = LESSON_FIXTURES["long-description"];
  return (
    <div className="dl-app flex min-h-screen w-full max-w-full overflow-x-hidden">
      <nav aria-label="Lecciones" className="hidden w-80 shrink-0 border-r-2 border-foreground bg-card p-4 md:block">
        <CourseSidebarItem id="ch-1" label="Lección 1" courseId={courseId} isCourseFree isLocked={false} isAccessible isCompleted type="TEXT" />
        <CourseSidebarItem id="ch-2" label="Lección 2" courseId={courseId} isCourseFree isLocked={false} isAccessible type="TEXT" />
        <CourseSidebarItem id="ch-3" label="Lección 3" courseId={courseId} isCourseFree isLocked isAccessible={false} lockReason="ENROLLMENT_REQUIRED" type="TEXT" />
      </nav>
      <main className="dl-stamped min-w-0 flex-1">
        <ContentViewer
          title={lesson.title}
          description={lesson.description}
          richContent={lesson.richContent}
          courseId={courseId}
          chapterId={chapterId}
          completeOnEnd={false}
          isAuthenticated
          currentUser={user}
          attachments={[
            { id: "a1", name: "Guia-de-ahorro-fuera-del-sistema-y-preferencia-temporal-modulo-7.pdf", url: "https://example.com/guia.pdf" },
          ]}
        />
      </main>
    </div>
  );
}
