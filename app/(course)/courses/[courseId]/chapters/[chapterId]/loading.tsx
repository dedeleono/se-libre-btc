import { Skeleton } from "@/components/ui/skeleton";

// Content-only skeleton for chapter -> chapter navigation within an already
// mounted course. The course layout (sidebar + navbar) is preserved; only the
// <main> content area swaps to this fallback. Mirrors content-viewer's
// max-w-5xl container.
export default function ChapterLoading() {
  return (
    <div className="flex h-full flex-col">
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
    </div>
  );
}
