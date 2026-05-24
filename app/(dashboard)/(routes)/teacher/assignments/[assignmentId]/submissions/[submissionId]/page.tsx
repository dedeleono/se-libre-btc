import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { GradingForm } from "./_components/grading-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollText } from "lucide-react";

interface GradingPageProps {
  params: {
    assignmentId: string;
    submissionId: string;
  };
}

const GradingPage = async ({ params }: GradingPageProps) => {
  const session = await auth();

  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    return redirect("/");
  }

  const submission = await prisma.submission.findUnique({
    where: {
      id: params.submissionId,
      assignmentId: params.assignmentId,
    },
    include: {
      answers: {
        include: {
          question: {
            include: {
              options: true,
            },
          },
        },
      },
      assignment: {
        include: {
          questions: true,
          chapter: true,
        },
      },
      student: true,
      attachments: true,
    },
  });

  if (!submission) {
    return redirect("/");
  }

const maxPoints = submission.assignment.questions.reduce(
  (acc, question) => acc + question.points,
  0
);

     return (
       <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 max-w-[calc(100vw-5px)] mx-auto w-full">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
           <div className="flex items-start gap-3 md:gap-4">
             <Link
               href={`/teacher/assignments/${params.assignmentId}/submissions`}
               className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
             >
               <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
             </Link>
             <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-600/20 via-blue-600/10 to-blue-600/5 
               dark:from-blue-600/30 dark:via-blue-600/20 dark:to-transparent 
               border border-blue-500/10 dark:border-white/[0.05] 
               shadow-sm dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm
               group-hover:shadow-md transition-all duration-300">
               <ScrollText className="h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
             </div>
             <div className="space-y-1">
               <div className="flex items-center gap-2">
                 <h1 className="text-2xl md:text-3xl font-black tracking-tight 
                   bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.8)]
                   dark:from-[hsl(var(--primary))] dark:to-[hsl(var(--primary)/0.7)]
                   bg-clip-text text-transparent
                   font-['Open_Sans']">
                   Calificar Tarea
                 </h1>
                 <Badge variant="outline" 
                   className={cn(
                     "text-xs",
                     submission.assignment.isQuiz
                       ? "text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20"
                       : "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                   )}>
                   {submission.assignment.isQuiz ? "Parcial" : "Tarea"}
                 </Badge>
               </div>
               <div className="flex items-center gap-2">
                 <p className="text-sm text-muted-foreground dark:text-white/50 font-['Open_Sans']">
                   {submission.student.name} · {submission.assignment.title}
                 </p>
                 <Badge variant="secondary" 
                   className="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 
                   text-xs font-medium">
                   {maxPoints.toFixed(0)} pts
                 </Badge>
               </div>
             </div>
           </div>
         </div>

         <div className="bg-gradient-to-br from-card/50 to-card rounded-xl border 
           shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_15px_rgba(0,0,0,0.08)]
           dark:from-black/40 dark:to-black/20 dark:border-white/[0.05] 
           dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_2px_15px_rgba(0,0,0,0.3)]
           dark:backdrop-blur-xl transition-all duration-300">
           <div className="p-4 sm:p-6 rounded-xl">
             <GradingForm submission={submission} />
           </div>
         </div>
       </div>
     );
};

export default GradingPage;
