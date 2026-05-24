import { StudentAssignmentScore } from "@prisma/client";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface RecentUploadsProps {
  scores: Array<
    StudentAssignmentScore & {
      assignment: {
        title: string;
      };
    }
  >;
}

export function RecentUploads({ scores }: RecentUploadsProps) {
  return (
    <div className="space-y-8">
      {scores.map((score) => (
        <div key={score.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {score.assignment.title.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {score.assignment.title}
            </p>
            <p className="text-sm text-muted-foreground">
              Calificación: {score.score.toFixed(1)}/{score.maxScore}
            </p>
          </div>
          <div className="ml-auto font-medium">
            {((score.score / score.maxScore) * 100).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
}
