import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Level, User, LevelTeacher, LevelCourse, Course } from "@prisma/client";
import { StudentsList } from "./student-list";
import { TeachersList } from "./teacher-list";

interface LevelCardProps {
  level: Level & {
    students: User[];
    teacherLevels: (LevelTeacher & {
      teacher: User;
    })[];
    levelCourses: (LevelCourse & {
      course: Course;
    })[];
  };
}

export function LevelCard({ level }: LevelCardProps) {
  return (
    <Card >
      <CardHeader>
        <CardTitle>{level.name}</CardTitle>
        <CardDescription>
          {level.students.length} estudiantes · {level.teacherLevels.length}{" "}
          profesores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="students">
          <TabsList>
            <TabsTrigger value="students">Estudiantes</TabsTrigger>
            <TabsTrigger value="teachers">Profesores</TabsTrigger>
            <TabsTrigger value="courses">Cursos</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <StudentsList levelId={level.id} students={level.students} />
          </TabsContent>

          <TabsContent value="teachers">
            <TeachersList levelId={level.id} teachers={level.teacherLevels} />
          </TabsContent>

          <TabsContent value="courses">
            {/* <CoursesList levelId={level.id} courses={level.levelCourses} /> */}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
