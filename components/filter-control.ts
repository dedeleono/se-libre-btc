import { cn } from "@/lib/utils";

export function filterControlClass(isEmpty: boolean, className?: string) {
  return cn(
    "h-10 w-full justify-between gap-2 rounded-[2px] border-2 border-input bg-card px-3 text-base normal-case tracking-normal shadow-none md:text-sm data-[size=default]:h-10",
    "hover:translate-x-0 hover:translate-y-0 hover:border-foreground/40 hover:bg-card hover:shadow-none active:shadow-none dark:bg-card dark:shadow-none dark:hover:bg-card dark:active:shadow-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isEmpty ? "font-normal text-muted-foreground" : "font-semibold text-foreground",
    className,
  );
}
