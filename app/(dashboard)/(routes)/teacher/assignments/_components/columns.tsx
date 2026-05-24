"use client";

import { Assignment, Chapter, Course, Level, LevelCourse } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ClipboardList, MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistance } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { AssignmentWithRelations } from "@/types/assignments";
import { CaretSortIcon } from "@radix-ui/react-icons";

export const columns: ColumnDef<AssignmentWithRelations>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="hidden sm:block">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="hidden sm:block">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
          className="hover:bg-transparent dark:text-white/70 dark:hover:bg-white/5"
        >
          <span className="hidden sm:inline">Title</span>
          <span className="sm:hidden">Tarea</span>
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      // Mobile view: Show title and type together
      return (
        <div className="space-y-1">
          <div>{row.getValue("title")}</div>
          <div className="sm:hidden">
            <Badge 
              className={cn(
                "bg-opacity-10 border-0",
                row.getValue("isQuiz")
                  ? "bg-orange-100 text-orange-500 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400" 
                  : "bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400"
              )}
            >
              {row.getValue("isQuiz") ? "Quiz" : "Assignment"}
            </Badge>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "isQuiz",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hidden sm:flex hover:bg-transparent dark:text-white/70 dark:hover:bg-white/5"
        >
          Type
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isQuiz = row.getValue("isQuiz");
      return (
        <div className="hidden sm:flex items-center">
          <Badge 
            className={cn(
              "bg-opacity-10 border-0",
              isQuiz 
                ? "bg-orange-100 text-orange-500 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400" 
                : "bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400"
            )}
          >
            {isQuiz ? "Quiz" : "Assignment"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "course",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent dark:text-white/70 dark:hover:bg-white/5"
        >
          Course
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const course = row.original.chapter?.module?.course;
      return course?.title || "N/A";
    },
    sortingFn: (rowA, rowB) => {
      const courseA = rowA.original.chapter?.module?.course?.title || "";
      const courseB = rowB.original.chapter?.module?.course?.title || "";
      return courseA.localeCompare(courseB);
    }
  },
  {
    accessorKey: "levels",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hidden sm:flex hover:bg-transparent dark:text-white/70 dark:hover:bg-white/5"
        >
          Levels
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const levels = row.original.chapter?.module?.course?.levelCourses;
      if (!levels?.length) return "N/A";
      
      return (
        <div className="hidden sm:flex flex-wrap gap-1">
          {levels.map((lc) => (
            <Badge 
              key={lc.level.id} 
              className="bg-sky-100 text-sky-700 hover:bg-sky-100 bg-opacity-10 border-0 dark:bg-sky-500/10 dark:text-sky-400"
            >
              {lc.level.name}
            </Badge>
          ))}
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const levelsA = rowA.original.chapter?.module?.course?.levelCourses || [];
      const levelsB = rowB.original.chapter?.module?.course?.levelCourses || [];
      const levelNamesA = levelsA.map(lc => lc.level.name).sort().join(',');
      const levelNamesB = levelsB.map(lc => lc.level.name).sort().join(',');
      return levelNamesA.localeCompare(levelNamesB);
    }
  },
  // {
  //   accessorKey: "createdAt",
  //   header: "Created",
  //   cell: ({ row }) => {
  //     return (
  //       <span>
  //         {formatDistance(new Date(row.original.createdAt), new Date(), {
  //           addSuffix: true,
  //         })}
  //       </span>
  //     );
  //   },
  // },
  {
    id: "actions",
    cell: ({ row }) => {
      const assignment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/teacher/assignments/${assignment.id}`}>
              <DropdownMenuItem>
                <Pencil className="h-4 w-4 mr-2" />
                Editar Quiz
              </DropdownMenuItem>
            </Link>
            <Link href={`/teacher/assignments/${assignment.id}/submissions`}>
              <DropdownMenuItem>
                <ClipboardList className="h-4 w-4 mr-2" />
                Ver Entregas
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
