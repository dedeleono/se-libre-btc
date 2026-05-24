"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings2Icon, Trash } from "lucide-react";
import { Level, User, LevelTeacher, LevelCourse, Course } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUpRight } from "lucide-react";
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

interface LevelsDataTableProps {
  data: Array<
    Level & {
      students: User[];
      teacherLevels: (LevelTeacher & {
        teacher: User;
      })[];
      levelCourses: (LevelCourse & {
        course: Course;
      })[];
    }
  >;
  unassignedUsers: UnassignedUsers;
}

type DialogContent = "students" | "teachers" | "courses" | null;

export function LevelsDataTable({
  data,
  unassignedUsers,
}: LevelsDataTableProps) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const selectedLevelData = data.find((level) => level.id === selectedLevel);

  const router = useRouter();

  const fetchAvailableCourses = async (levelId: string) => {
    try {
      setIsLoadingCourses(true);
      const response = await axios.get(`/api/levels/${levelId}/courses`);
      
      setAvailableCourses(response.data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleAssignLevel = async (userId: string, levelId: string) => {
    try {
      setIsLoading(userId);
      const endpoint = `/api/students/${userId}/level`;

      await axios.post(endpoint, { levelId });

      toast.success("Estudiante asignado exitosamente");

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al asignar el usuario");
    } finally {
      setIsLoading(null);
    }
  };

  useEffect(() => {
    if (dialogContent === "courses" && selectedLevel) {
      fetchAvailableCourses(selectedLevel);
    }
  }, [dialogContent, selectedLevel]);

  return (
    <React.Fragment>
      <Accordion type="single" collapsible className="w-full space-y-4">
        <AccordionItem
          value="unassigned"
          className="border-red-500 rounded-lg shadow-sm bg-red-100/50 dark:bg-red-900/50"
        >
          <AccordionTrigger className="hover:no-underline px-4">
            <div className="flex w-full items-center justify-between">
              <div className="font-medium text-red-600 dark:text-red-400 sm:text-sm text-xs">
                Sin asignar
              </div>
              <div className="flex items-center gap-2 mx-2">
                <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-md">
                  {unassignedUsers.students.length} estudiantes
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className=" pb-6">
            <div className="max-w-[calc(100vw-3rem)] overflow-x-auto rounded-xl border bg-background">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sm:text-sm text-xs text-primary font-black">Nombre</TableHead>
                    <TableHead className="sm:text-sm text-xs text-primary font-black">Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedUsers.students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground sm:text-sm text-xs">
                          <p>No hay estudiantes sin asignar</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    unassignedUsers.students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Select
                            disabled={isLoading === student.id}
                            onValueChange={(levelId) =>
                              handleAssignLevel(student.id, levelId)
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Seleccionar nivel" />
                            </SelectTrigger>
                            <SelectContent>
                              {data.map((level) => (
                                <SelectItem key={level.id} value={level.id}>
                                  {level.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="w-[100px]">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors"
                              asChild
                            >
                              <Link
                                href={`/student/${student.id}`}
                                className="flex items-center justify-center"
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                              onClick={() =>
                                setUserToDelete({
                                  id: student.id,
                                  name: student.name || student.email,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </AccordionItem>

        {data
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((level) => (
            <AccordionItem
              key={level.id}
              value={level.id}
              className="border-emerald-500 dark:border-emerald-900 rounded-lg shadow-md bg-gradient-to-r from-emerald-50/15 to-teal-50/15 dark:from-emerald-950/10 dark:to-teal-950/10 transition-all duration-200 hover:shadow-lg"
            >
              <AccordionTrigger className="hover:no-underline px-4">
                <div className="flex w-full items-center justify-between">
                  <div className="font-medium text-emerald-700 dark:text-emerald-600 sm:text-base text-sm truncate max-w-[25ch]">
                    {level.name.length > 26
                      ? `${level.name.slice(0, 25)}...`
                      : level.name}
                  </div>
                  <div className="flex items-center gap-2 mx-2">
                    <span className="text-xs bg-sky-50/50 text-emerald-600 dark:bg-sky-100/10 dark:text-emerald-500/70 px-2 py-1 rounded-md text-nowrap">
                      {level.students.length} estudiantes
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-6">
                <div className="max-w-[calc(100vw-5rem)] overflow-x-auto rounded-xl border bg-background">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sm:text-sm text-xs text-primary font-black">
                          Nombre
                        </TableHead>
                        <TableHead className="sm:text-sm text-xs text-primary font-black">
                          Email
                        </TableHead>
                        <TableHead className="sm:text-sm text-xs text-primary font-black">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {level.students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground sm:text-sm text-xs">
                              <p>No hay estudiantes en este grado aún</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        level.students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="sm:text-sm text-xs ">
                              {student.name}
                            </TableCell>
                            <TableCell className="sm:text-sm text-xs ">
                              {student.email}
                            </TableCell>
                            <TableCell className="w-[100px]">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors"
                                  asChild
                                >
                                  <Link
                                    href={`/student/${student.id}`}
                                    className="flex items-center justify-center"
                                  >
                                    <ArrowUpRight className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                  onClick={() =>
                                    setUserToDelete({
                                      id: student.id,
                                      name: student.name || student.email,
                                    })
                                  }
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>

      {userToDelete && (
        <DeleteUserDialog
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          userId={userToDelete.id}
          userType="student"
          userName={userToDelete.name}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </React.Fragment>
  );
}
