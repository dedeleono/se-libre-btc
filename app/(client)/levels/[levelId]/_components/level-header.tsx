import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, Users, BookOpen } from "lucide-react";

interface LevelHeaderProps {
  level: any; // You can type this properly based on the prisma query
}

export const LevelHeader = ({ level }: LevelHeaderProps) => {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center gap-x-3 font-['Open_Sans']">
        <div className="p-2 bg-orange-100 rounded-full dark:bg-orange-500/10">
          <GraduationCap className="w-8 h-8 text-orange-700 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-primary dark:text-secondary ">{level.name}</h1>
          <div className="flex items-center gap-x-2 text-slate-500 dark:text-white/70">
            <Users className="h-4 w-4" />
            <span>{level.students.length} estudiantes inscritos</span>
            <span>•</span>
            <BookOpen className="h-4 w-4" />
            <span>{level.levelCourses.length} cursos</span>
          </div>
        </div>
      </div>

      {level.teacherLevels.length > 0 && (
        <div className="flex flex-col gap-y-2">
          <h3 className="font-medium dark:text-white/90 font-['Open_Sans']">Maestros</h3>
          <div className="flex items-center gap-x-2">
            {level.teacherLevels.map((teacherLevel: any) => (
              <Avatar key={teacherLevel.teacher.id} className="h-8 w-8">
                <AvatarImage src={teacherLevel.teacher.image || ""} />
                <AvatarFallback className="bg-accent/10 text-accent font-bold">
                  {teacherLevel.teacher.name?.charAt(0) || "T"}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
