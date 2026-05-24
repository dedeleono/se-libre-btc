import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface RecentSubmissionsCardProps {
  scores: {
    id: string;
    score: number;
    submittedAt: Date;
    submission: {
      id: string;
    };
    assignment: {
      id: string;
      title: string;
    };
  }[];
  className?: string;
}

export const RecentSubmissionsCard = ({ scores, className }: RecentSubmissionsCardProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-primary dark:text-secondary font-['Open_Sans']">
          
          Entregas Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scores.map((score, index) => (
            <Link
              href={`/student/portfolio/${score.submission.id}`}
              key={score.id}
              className="block cursor-pointer"
            >
              <div className="flex items-center justify-between p-3 rounded-lg 
                dark:bg-card bg-slate-100/50 hover:bg-muted/50 dark:hover:bg-muted/10
                border border-transparent hover:border-border/50
                group transition-all duration-200 ease-in-out"
              >
                <div className="space-y-1.5">
                  <p className="font-medium leading-none group-hover:text-primary 
                    transition-colors line-clamp-1 text-sm md:text-base"
                  >
                    {score.assignment.title}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-70"
                    >
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    {format(new Date(score.submittedAt), "PPP", { locale: es })}
                  </p>
                </div>
                <div className={cn(
                  "font-medium text-xs md:text-sm px-3 py-1.5 rounded-full transition-all duration-200",
                  score.score >= 7
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : score.score >= 6
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                    : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                )}>
                  {score.score.toFixed(1)} pts
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 