import { Skeleton } from "@/components/ui/skeleton";

// Rendered instantly on navigation into a course (e.g. clicking "Continuar"),
// covering the course layout's data fetch. Mirrors the real shell in
// app/(course)/courses/[courseId]/layout.tsx: fixed navbar (h-16) + fixed
// sidebar (w-80) + max-w-5xl content area.
export default function CourseLoading() {
  return (
    <div className="dl-app h-full w-full max-w-full overflow-x-hidden">
      {/* Navbar */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 w-full items-center gap-3 border-b border-foreground/10 bg-background px-4 md:pl-[21rem]">
        <Skeleton className="h-8 w-8 md:hidden" />
        <Skeleton className="h-4 w-44" />
        <Skeleton className="ml-auto h-8 w-24" />
      </div>

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 hidden h-full w-80 flex-col gap-4 border-r border-foreground/10 bg-background p-4 pt-20 md:flex">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="dl-stamped h-full w-full max-w-full pt-16 md:pl-80">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-y-4 p-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="aspect-video w-full" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </main>
    </div>
  );
}
