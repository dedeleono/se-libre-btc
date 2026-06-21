import { Skeleton } from "@/components/ui/skeleton";

// Preview routes have no course sidebar, so they get their own centered
// skeleton rather than inheriting the full course shell from courses/loading.tsx.
export default function PreviewLoading() {
  return (
    <div className="dl-app dl-stamped min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-y-4 p-4 pt-16">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="aspect-video w-full" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}
