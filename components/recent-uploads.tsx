import { Avatar, AvatarFallback } from "./ui/avatar";

interface RecentUploadsProps {
  scores: Array<
    {
      id: string;
      title: string;
      scorePercent: number | null;
      passed: boolean | null;
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
              {score.title.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {score.title}
            </p>
            <p className="text-sm text-muted-foreground">
              Resultado: {score.passed ? "Aprobado" : "Intento registrado"}
            </p>
          </div>
          <div className="ml-auto font-medium">
            {score.scorePercent?.toFixed(1) ?? "0.0"}%
          </div>
        </div>
      ))}
    </div>
  );
}
