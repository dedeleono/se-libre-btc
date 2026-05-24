import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DataCardProps {
  label: string;
  value: number;
  description?: string;
  className?: string;
  icon?: ReactNode;
}

export const DataCard = ({
  label,
  value,
  description,
  className,
  icon,
}: DataCardProps) => {
  return (
    <Card className={cn("border-2 border-primary/10 shadow-md hover:shadow-lg transition-all duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-medium text-muted-foreground/80 flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 dark:bg-primary/20 rounded-full">
            {icon}
          </div>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="text-3xl font-bold text-primary dark:text-primary/90">
          {value}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground/70 font-medium">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
