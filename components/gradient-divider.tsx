export function GradientDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`h-[1px] w-full bg-gradient-to-r from-transparent via-border to-transparent ${className}`} />
  );
} 