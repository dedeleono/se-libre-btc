"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";  
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  FolderIcon,
  GraduationCap,
  MoreHorizontal,
  PencilIcon,
  Trash,
  UserPlus,
  GripVertical,
  Settings2Icon,
  LucideBedDouble,
  Grip,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { AssignTeacherDialog } from "./assign-teacher-dialog";
import { AssignLevelDialog } from "./assign-level-dialog";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { DeleteCourseDialog } from "./delete-course-dialog";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Separator } from "@/components/ui/separator";
import { DuplicateLevelDialog } from "./duplicate-level-dialog";
import { DeleteLevelDialog } from "./delete-level-dialog";

// Existing interfaces remain the same
interface Teacher {
  id: string;
  name: string | null;
  role: UserRole;
  email: string;
  emailVerified: Date | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  image: string | null;
  levelId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StudentCourse {
  id: string;
  studentId: string;
  courseId: string;
  isPaid: boolean;
  isAssignedByLevel: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Course {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  isPublished: boolean;
  teacher: Teacher | null;
  studentCourses: StudentCourse[];
  levelCourses: {
    level: {
      students: User[];
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;
  name?: string | null;
  email: string;
}

interface LevelCourse {
  id: string;
  levelId: string;
  courseId: string;
  course: Course;
  createdAt: Date;
  updatedAt: Date;
}

interface Level {
  id: string;
  name: string;
  position: number;
  levelCourses: LevelCourse[];
  students: User[];
}

interface AllCoursesTableProps {
  initialData: Level[];
  unassignedCourses?: Course[];
}

// New reusable components
const CourseTableHeader = () => (
  <TableHeader className="bg-muted/50">
    <TableRow>
      <TableHead className="font-semibold text-primary">Nombre</TableHead>
      <TableHead className="font-semibold text-primary">Profesor</TableHead>
      <TableHead className="font-semibold text-primary">Estudiantes</TableHead>
      <TableHead className="w-[70px]"></TableHead>
    </TableRow>
  </TableHeader>
);

interface CourseRowProps {
  course: Course;
  onAssignTeacher?: (course: Course) => void;
  onAssignLevel?: (course: Course) => void;
  setCourseToDelete: (course: Course | null) => void;
}

const CourseRow = ({
  course,
  onAssignTeacher,
  onAssignLevel,
  setCourseToDelete,
}: CourseRowProps) => {
  const router = useRouter();

  const getTotalStudents = (course: Course) => {
    // Get unique student IDs from direct assignments
    const directStudentIds = new Set(
      course.studentCourses.map((sc) => sc.studentId)
    );

    // Add student IDs from level assignments
    course.levelCourses?.forEach((lc) => {
      lc.level.students?.forEach((student) => {
        directStudentIds.add(student.id);
      });
    });

    // Return total unique students
    return directStudentIds.size;
  };

  return (
    <TableRow
      key={course.id}
      className="hover:bg-muted/50 dark:hover:bg-secondary/5 transition-colors"
    >
      <TableCell className="font-medium sm:text-sm text-xs text-nowrap">
        {course.title}
      </TableCell>
      <TableCell className="font-medium sm:text-sm text-xs text-nowrap">
        {course.teacher?.name ? (
          <div className="flex items-center gap-2">
            {course.teacher.image && (
              <Image
                src={course.teacher.image}
                alt={course.teacher.name}
                className="h-6 w-6 rounded-full"
                width={24}
                height={24}
              />
            )}
            <span className="text-nowrap">{course.teacher.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground italic text-nowrap">
            Sin profesor
          </span>
        )}
      </TableCell>
      <TableCell className="font-medium sm:text-sm text-xs text-nowrap sm:text-left text-center">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted text-nowrap">
          {getTotalStudents(course)}{" "}
          <span className="sm:inline hidden">estudiantes</span>
        </span>
      </TableCell>
      <TableCell className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-muted transition-colors"
            >
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem
              onClick={() => router.push(`/admin/courses/${course.id}`)}
              className="gap-2 sm:text-sm text-xs"
            >
              <Eye className="h-4 w-4" /> Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/courses/${course.id}`)}
              className="gap-2 sm:text-sm text-xs"
            >
              <Eye className="h-4 w-4" /> Modo Estudiante
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/teacher/courses/${course.id}`)}
              className="gap-2 sm:text-sm text-xs"
            >
              <PencilIcon className="h-4 w-4" /> Editar curso
            </DropdownMenuItem>
            {onAssignTeacher && (
              <DropdownMenuItem
                onClick={() => onAssignTeacher(course)}
                className="gap-2 sm:text-sm text-xs"
              >
                <UserPlus className="h-4 w-4" /> Asignar profesor
              </DropdownMenuItem>
            )}
            {onAssignLevel && (
              <DropdownMenuItem
                onClick={() => onAssignLevel(course)}
                className="gap-2 sm:text-sm text-xs"
              >
                <GraduationCap className="h-4 w-4" /> Asignar Grado
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-muted transition-colors text-red-600 hover:text-red-600"
          onClick={() => {
            setCourseToDelete(course);
          }}
        >
          <span className="sr-only">Eliminar curso</span>
          <Trash className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

interface SectionHeaderProps {
  title: string;
  description: string;
  count?: number;
}

const SectionHeader = ({ title, description, count }: SectionHeaderProps) => (
  <div className="flex items-center justify-between p-6 border-b">
    <div className="space-y-1">
      <h2 className="sm:text-2xl text-lg font-semibold tracking-tight">{title}</h2>
      <p className="sm:text-sm hidden sm:block text-muted-foreground">{description}</p>
    </div>
    {count !== undefined && (
      <div className="rounded-full bg-destructive px-3 py-1 sm:text-sm text-xs font-bold text-red-100 text-nowrap">
        {count} cursos
      </div>
    )}
  </div>
);

export default function AllCoursesTable({
  initialData,
  unassignedCourses = [],
}: AllCoursesTableProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [courseToAssignLevel, setCourseToAssignLevel] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [levels, setLevels] = useState(initialData);
  const [isMounted, setIsMounted] = useState(false);
  const [levelToDuplicate, setLevelToDuplicate] = useState<Level | null>(null);
  const [levelToDelete, setLevelToDelete] = useState<Level | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get("/api/teachers?role=TEACHER");
        setTeachers(response.data);
      } catch (error) {
        toast.error("Error al cargar profesores");
      }
    };
    fetchTeachers();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setLevels(initialData);
  }, [initialData]);

  const handleDeleteCourse = async (course: Course) => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/courses/${course.id}`);
      toast.success("Curso eliminado exitosamente");
      router.refresh();
    } catch (error) {
      toast.error("Error al eliminar el curso");
    } finally {
      setIsLoading(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(levels);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Immediately update UI
    setLevels(items);
    setIsReordering(true);

    try {
      const bulkUpdateData = items.map((level, index) => ({
        id: level.id,
        position: index,
      }));

      const response = await axios.put("/api/levels/reorder", {
        list: bulkUpdateData,
      });

      if (response.data.levels) {
        setLevels(response.data.levels);
      }
      toast.success("Orden actualizado");
    } catch {
      toast.error("Algo salió mal");
      setLevels(initialData);
    } finally {
      setIsReordering(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-8 ">
      {/* Assigned Courses Section */}
      <section className="rounded-xl bg-card shadow-sm dark:border-white/[0.08] dark:shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.05)] dark:backdrop-blur-sm">
        <SectionHeader
          title="Cursos por grado"
          description="Listado de cursos organizados por grado académico"
        />
        <div className="p-6 dark:bg-gradient-to-b dark:from-card/50 dark:to-card/30">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="levels">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="relative w-full"
                >
                  <Accordion type="multiple" className="w-full space-y-4">
                    {levels.map((level, index) => (
                      <Draggable
                        key={level.id}
                        draggableId={level.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "mb-4",
                              snapshot.isDragging &&
                                "rounded-lg shadow-md bg-slate-200 dark:bg-slate-800"
                            )}
                            style={{
                              ...provided.draggableProps.style,
                              transform:
                                provided.draggableProps.style?.transform,
                            }}
                          >
                            <AccordionItem
                              value={level.id}
                              className={cn(
                                "border rounded-lg px-2 transition-all duration-200",
                                "dark:bg-gradient-to-r dark:from-card/50 dark:to-card/30",
                                "dark:border-white/[0.08] dark:hover:bg-card/70",
                                "dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.03)]",
                                "hover:dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]"
                              )}
                            >
                              <div className="flex items-center gap-x-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className={cn(
                                    "px-2 py-2 rounded-l-md cursor-grab",
                                    "hover:bg-neutral-100 dark:hover:bg-white/[0.02]",
                                    "transition-colors",
                                    snapshot.isDragging && "cursor-grabbing"
                                  )}
                                >
                                  <Grip className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <AccordionTrigger
                                    className="sm:px-4 hover:no-underline rounded-md transition-all duration-200 
                                      dark:hover:bg-white/[0.02] group sm:mr-0 mr-2"
                                  >
                                    <div className="flex items-center justify-between flex-1 sm:pr-4">
                                      <span className="font-semibold dark:text-white/90 group-hover:dark:text-white/100 text-nowrap sm:text-sm text-xs truncate max-w-[200px]">
                                        {level.name.length > 21
                                          ? `${level.name.slice(0, 21)}...`
                                          : level.name}
                                      </span>
                                      <div className="p-2 flex flex-row items-center gap-2">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 p-0 hover:bg-muted transition-colors 
                                                dark:hover:bg-white/[0.03] dark:text-white/70 hover:dark:text-white/90"
                                            >
                                              <Settings2Icon className="h-4 w-4 text-gray-500 hover:text-primary transition-colors duration-200" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent
                                            align="end"
                                            className="w-[200px]"
                                          >
                                            <DropdownMenuItem
                                              className="gap-2 sm:text-sm text-xs"
                                              onClick={() =>
                                                router.push(`/admin/levels/${level.id}`)
                                              }
                                            >
                                              <Eye className="h-4 w-4" />{" "}
                                              Ver grado
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="gap-2 sm:text-sm text-xs"
                                              onClick={() =>
                                                setLevelToDuplicate(level)
                                              }
                                            >
                                              <LucideBedDouble className="h-4 w-4" />{" "}
                                              Duplicar grado
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="gap-2 text-red-600 focus:text-red-600 sm:text-sm text-xs"
                                              onClick={() =>
                                                setLevelToDelete(level)
                                              }
                                            >
                                              <Trash className="h-4 w-4" />{" "}
                                              Eliminar grado
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Separator
                                          orientation="vertical"
                                          className="h-6 dark:bg-white/[0.08]"
                                        />
                                        <span
                                          className={cn(
                                            "text-sm px-2.5 py-0.5 rounded-full transition-all duration-200 sm:inline-block hidden sm:ml-2",
                                            level.levelCourses.length > 0
                                              ? "bg-green-700/90 text-green-100 dark:bg-green-500/70 dark:text-green-100/90 dark:shadow-[0_0_1px_1px_rgba(74,222,128,0.1)]"
                                              : "text-muted-foreground dark:text-muted-foreground/70"
                                          )}
                                        >
                                          {level.levelCourses.length} cursos
                                        </span>
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                </div>
                              </div>
                              <AccordionContent className="pt-4 px-4">
                                <Table>
                                  <CourseTableHeader />
                                  <TableBody className="dark:divide-white/[0.03]">
                                    {level.levelCourses.length === 0 ? (
                                      <TableRow>
                                        <TableCell
                                          colSpan={4}
                                          className="h-24 text-center"
                                        >
                                          No hay cursos asignados a este grado
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      level.levelCourses.map(({ course }) => (
                                        <CourseRow
                                          key={course.id}
                                          course={course}
                                          onAssignTeacher={(course) =>
                                            setSelectedCourse(course)
                                          }
                                          onAssignLevel={(course) =>
                                            setCourseToAssignLevel(course)
                                          }
                                          setCourseToDelete={setCourseToDelete}
                                        />
                                      ))
                                    )}
                                  </TableBody>
                                </Table>
                              </AccordionContent>
                            </AccordionItem>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Accordion>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </section>

      {/* Unassigned Courses Section */}
      <section className="rounded-xl  bg-card shadow-sm dark:border-white/[0.08] dark:shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.05)] dark:backdrop-blur-sm">
        <SectionHeader
          title="Cursos sin asignar"
          description="Estos cursos aún no están asignados a ningún grado"
          count={unassignedCourses.length}
        />
        <div className="p-6 dark:bg-gradient-to-b dark:from-card/50 dark:to-card/30">
          <div className="max-w-[calc(100vw-3rem)] overflow-x-auto rounded-xl border bg-background">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="sm:text-sm text-xs text-primary font-black">
                    Nombre
                  </TableHead>
                  <TableHead className="sm:text-sm text-xs text-primary font-black">
                    Profesor
                  </TableHead>
                  <TableHead className="sm:text-sm text-xs text-primary font-black">
                    Estudiantes
                  </TableHead>
                  <TableHead className="sm:text-sm text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedCourses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <FolderIcon className="h-8 w-8 opacity-50" />
                        <span>No hay cursos sin asignar</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {unassignedCourses.map((course: Course) => (
                      <CourseRow
                        key={course.id}
                        course={course}
                        onAssignTeacher={(course) => setSelectedCourse(course)}
                        onAssignLevel={(course) =>
                          setCourseToAssignLevel(course)
                        }
                        setCourseToDelete={setCourseToDelete}
                      />
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Dialogs */}
      {selectedCourse && (
        <AssignTeacherDialog
          isOpen={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
          courseId={selectedCourse.id}
          teachers={teachers}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
      {courseToAssignLevel && (
        <AssignLevelDialog
          isOpen={!!courseToAssignLevel}
          onClose={() => setCourseToAssignLevel(null)}
          courseId={courseToAssignLevel.id}
          levels={initialData}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
      {courseToDelete && (
        <DeleteCourseDialog
          isOpen={!!courseToDelete}
          onClose={() => setCourseToDelete(null)}
          courseId={courseToDelete.id}
          onSuccess={() => {
            setCourseToDelete(null);
            router.refresh();
          }}
        />
      )}
      {levelToDuplicate && (
        <DuplicateLevelDialog
          isOpen={!!levelToDuplicate}
          onClose={() => setLevelToDuplicate(null)}
          levelId={levelToDuplicate.id}
          currentName={levelToDuplicate.name}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
      {levelToDelete && (
        <DeleteLevelDialog
          isOpen={!!levelToDelete}
          onClose={() => setLevelToDelete(null)}
          levelId={levelToDelete.id}
          hasStudents={levelToDelete.students.length > 0}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
