"use client";

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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Trash2, ChevronRight, Trash, BookOpen, ArrowUpRight } from "lucide-react";
import { Level, User, LevelTeacher, LevelCourse, Course } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StudentsList } from "./student-list";
import { TeachersList } from "./teacher-list";
import { CoursesList } from "./courses-list";
import React from "react";
import axios from "axios";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DeleteUserDialog } from "./delete-user-dialog";
import Link from "next/link";

interface UnassignedUsers {
  students: {
    id: string;
    name: string | null;
    email: string;
  }[];
  teachers: {
    id: string;
    name: string | null;
    email: string;
  }[];
}

interface TeachersDataTableProps {
  teachers: Array<
    User & {
      teacherLevels: (LevelTeacher & {
        level: Level;
      })[];
    }
  >;
  levels: Level[];
}

type DialogContent = "students" | "teachers" | "courses" | null;

const truncateEmail = (email: string) => {
  const [username, domain] = email.split('@');
  if (username.length <= 8) return email;
  return `${username.slice(0, 3)}...${username.slice(-2)}@${domain}`;
};

export function TeachersDataTable({ teachers, levels }: TeachersDataTableProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [openTeacherId, setOpenTeacherId] = useState<string | null>(null);

  const handleAssignTeacher = async (teacherId: string, levelId: string) => {
    try {
      setIsLoading(teacherId);
      const endpoint = `/api/teachers/${teacherId}/level`;

      await axios.post(endpoint, { levelId });
      toast.success("Profesor asignado exitosamente");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al asignar el profesor");
    } finally {
      setIsLoading(null);
    }
  };

  const handleUnassignTeacher = async (teacherId: string, levelId: string) => {
    try {
      setIsLoading(teacherId);
      const endpoint = `/api/teachers/${teacherId}/level`;

      await axios.delete(endpoint, { data: { levelId } });
      toast.success("Profesor removido exitosamente");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al remover el profesor");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div
      className="max-w-[calc(100vw-3rem)] overflow-x-auto rounded-2xl border bg-white/80 dark:bg-black/40
      shadow-[0_2px_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_20px_-10px_rgba(0,0,0,0.3)]
      dark:border-white/[0.05]"
    >
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-0">
            <TableHead
              className="h-12 font-semibold text-sm text-muted-foreground/80 
              bg-accent/30 first:rounded-tl-2xl"
            >
              Nombre
            </TableHead>
            <TableHead
              className="h-12 font-semibold text-sm text-muted-foreground/80 
              bg-accent/30 "
            >
              Email
            </TableHead>
            <TableHead
              className="h-12 font-semibold text-sm text-muted-foreground/80 
              bg-accent/30"
            >
              Niveles
            </TableHead>
            <TableHead
              className="h-12 font-semibold text-sm text-muted-foreground/80 
              bg-accent/30 last:rounded-tr-2xl"
            >
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => (
            <TableRow
              key={teacher.id}
              className="group transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-900/50
                border-b last:border-b-0"
            >
              <TableCell className="py-4 font-medium">
                <div className="flex items-center gap-3 text-nowrap">
                  <div
                    className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 
                    flex items-center justify-center text-primary font-semibold sm:text-sm text-xs
                    group-hover:scale-105 transition-transform duration-200"
                  >
                    {teacher.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-slate-700 dark:text-slate-200 sm:text-sm text-xs text-nowrap">
                    {teacher.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="">
                <span className="text-muted-foreground/70 sm:text-sm text-xs">
                  {truncateEmail(teacher.email)}
                </span>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  className="group flex items-center gap-2.5 active:bg-secondary/50 
                    transition-all duration-200 rounded-lg pr-4 pl-2 hover:bg-transparent"
                  onClick={() => setOpenTeacherId(teacher.id)}
                >
                  <span
                    className="bg-primary/10 dark:bg-primary/20 px-2.5 py-1.5 
                    rounded-md text-sm font-medium flex items-center gap-2 group-hover:bg-primary/15 
                    dark:group-hover:bg-primary/25 transition-colors duration-200 border border-primary/10 
                    dark:border-primary/20 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] dark:shadow-primary/10"
                  >
                    <span
                      className="flex items-center justify-center w-5 h-5 bg-primary/10 
                      dark:bg-primary/20 rounded-md text-xs font-black tracking-wide leading-6 transition-transform 
                      group-hover:scale-105 duration-200 text-secondary"
                    >
                      {teacher.teacherLevels.length}
                    </span>
                    <span className="text-primary/70 sm:text-sm text-xs">
                      grado
                      {teacher.teacherLevels.length > 1 ||
                      teacher.teacherLevels.length === 0
                        ? "s"
                        : ""}
                    </span>
                  </span>
                  <ChevronRight
                    className="w-4 h-4 text-muted-foreground/50 transition-transform 
                    duration-200 group-hover:translate-x-0.5 group-hover:text-primary/70"
                  />
                </Button>

                <Dialog
                  open={openTeacherId === teacher.id}
                  onOpenChange={() => setOpenTeacherId(null)}
                >
                  <DialogContent className="p-0 overflow-hidden sm:max-w-[700px]">
                    <DialogHeader
                      className="px-6 pt-6 pb-4 border-b border-border/10 dark:border-white/[0.05]
                      bg-secondary/20 dark:bg-secondary/40"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary 
                          flex items-center justify-center text-primary dark:text-slate-200 font-semibold text-lg"
                        >
                          {teacher.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <DialogTitle className="text-2xl font-bold">
                            {teacher.name}
                          </DialogTitle>
                          <DialogDescription className="text-xs text-muted-foreground/70">
                            Gestión de niveles asignados
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="px-4 sm:px-6 py-4 max-h-[60vh] overflow-y-auto">
                      {teacher.teacherLevels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div
                            className="w-12 h-12 rounded-full bg-secondary/30 dark:bg-secondary/20 
                            flex items-center justify-center mb-3"
                          >
                            <BookOpen className="w-6 h-6 text-muted-foreground/70" />
                          </div>
                          <p className="text-sm text-muted-foreground/70">
                            No hay niveles asignados aún
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                          {/* Primaria Column */}
                          <div className="space-y-3 min-w-0">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                Primaria
                              </h3>
                            </div>
                            {teacher.teacherLevels
                              .sort(
                                (a, b) =>
                                  (a.level.position ?? 0) -
                                  (b.level.position ?? 0)
                              )
                              .filter((level) =>
                                level.level.name
                                  .toLowerCase()
                                  .includes("primaria")
                              )
                              .map((teacherLevel) => (
                                <div
                                  key={teacherLevel.level.id}
                                  className="group flex items-center justify-between p-3 rounded-lg 
                                    bg-emerald-500/5 hover:bg-emerald-500/10
                                    dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 
                                    transition-all duration-200
                                    border border-emerald-500/10 dark:border-emerald-500/10 min-w-0"
                                >
                                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">
                                    {teacherLevel.level.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleUnassignTeacher(
                                        teacher.id,
                                        teacherLevel.level.id
                                      )
                                    }
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50/50 
                                      dark:hover:bg-red-500/10 sm:opacity-0 opacity-100 group-hover:opacity-100 
                                      transition-all duration-200 flex-shrink-0"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                          </div>

                          {/* Secundaria Column */}
                          <div className="space-y-3 min-w-0">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                Secundaria
                              </h3>
                            </div>
                            {teacher.teacherLevels
                              .sort(
                                (a, b) =>
                                  (a.level.position ?? 0) -
                                  (b.level.position ?? 0)
                              )
                              .filter(
                                (level) =>
                                  level.level.name
                                    .toLowerCase()
                                    .includes("básico") ||
                                  level.level.name
                                    .toLowerCase()
                                    .includes("bachillerato") ||
                                  level.level.name
                                    .toLowerCase()
                                    .includes("madurez")
                              )
                              .map((teacherLevel) => (
                                <div
                                  key={teacherLevel.level.id}
                                  className="group flex items-center justify-between p-3 rounded-lg 
                                    bg-blue-500/5 hover:bg-blue-500/10
                                    dark:bg-blue-500/5 dark:hover:bg-blue-500/10 
                                    transition-all duration-200
                                    border border-blue-500/10 dark:border-blue-500/10 min-w-0"
                                >
                                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
                                    {teacherLevel.level.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleUnassignTeacher(
                                        teacher.id,
                                        teacherLevel.level.id
                                      )
                                    }
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50/50 
                                      dark:hover:bg-red-500/10 sm:opacity-0 opacity-100 group-hover:opacity-100 
                                      transition-all duration-200 flex-shrink-0"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Select
                    disabled={isLoading === teacher.id}
                    onValueChange={(levelId) =>
                      handleAssignTeacher(teacher.id, levelId)
                    }
                  >
                    <SelectTrigger
                      className="w-[180px] md:w-[180px] bg-white/50 dark:bg-white/5 
                      border-border/50 dark:border-white/[0.05] hover:bg-secondary/50 
                      dark:hover:bg-white/10 transition-colors duration-200 sm:text-sm text-xs"
                    >
                      <SelectValue placeholder="Asignar grado" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm">
                      {[...levels]
                        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                        .map((level) => (
                          <SelectItem
                            key={level.id}
                            value={level.id}
                            className="hover:bg-secondary/60 transition-colors focus:bg-secondary/60 sm:text-sm text-xs"
                          >
                            {level.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50/50 
                      dark:hover:bg-red-500/10 opacity-100 md:opacity-0 group-hover:opacity-100 
                      transition-all duration-200"
                    onClick={() =>
                      setUserToDelete({
                        id: teacher.id,
                        name: teacher.name || teacher.email,
                      })
                    }
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors"
                    asChild
                  >
                    <Link
                      href={`/teacher/${teacher.id}`}
                      className="flex items-center justify-center"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {userToDelete && (
        <DeleteUserDialog
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          userId={userToDelete.id}
          userType="teacher"
          userName={userToDelete.name}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
