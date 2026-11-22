export const MAIN_CONTENT_ID = "main-content";

export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border-2 focus:border-foreground focus:bg-background focus:px-4 focus:py-2 focus:font-bold focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {label}
    </a>
  );
}
