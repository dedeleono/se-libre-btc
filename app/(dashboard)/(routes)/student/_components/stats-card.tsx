import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: React.ReactNode;
  description: string;
  icon: LucideIcon;
  trend: "positive" | "negative" | "neutral";
  className?: string;
}

const StatsCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) => {
  return (
    <Card className={cn(
      "hover:shadow-md transition-all duration-300",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-black text-foreground/90 font-['Open_Sans']">{title}</CardTitle>
        <div
          className={cn(
            "p-2 rounded-full",
            trend === "positive" && "bg-green-100 dark:bg-green-900/30",
            trend === "negative" && "bg-red-100 dark:bg-red-900/30",
            trend === "neutral" && "bg-blue-100 dark:bg-blue-900/30"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              trend === "positive" && "text-green-600 dark:text-green-400",
              trend === "negative" && "text-red-600 dark:text-red-400",
              trend === "neutral" && "text-blue-600 dark:text-blue-400"
            )}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary dark:text-primary/90">{value}</div>
        {/* <p className="text-xs text-muted-foreground/70">{description}</p> */}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
