"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScrollText, Search, GraduationCap, BookOpen, MoreHorizontal, ClipboardList, Pencil } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AssignmentWithRelations } from "@/types/assignments";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { SortingState, useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { flexRender } from "@tanstack/react-table";
import { GradientDivider } from "@/components/gradient-divider";
import { useDebounce } from "@/hooks/useDebounce";
import { useVirtualizer } from '@tanstack/react-virtual';
import { Pagination } from "@/components/ui/pagination";

interface Assignment {
  id: string;
  title: string;
  isQuiz: boolean;
  chapter: {
    module: {
      course: {
        id: string;
        title: string;
        levelCourses: {
          level: {
            id: string;
            name: string;
            position: number;
            price: number | null;
            inscriptionPrice: number | null;
            inscriptionPaid: boolean;
          };
        }[];
      };
    };
  };
  submissions: {
    id: string;
    studentId: string;
    status: "PENDING" | "SUBMITTED" | "GRADED";
    score: number | null;
    submittedAt: Date | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
  description?: string | null;
  isOnline: boolean;
  maxPoints?: number | null;
  timer?: number | null;
  deadline?: Date | null;
}

type DataTableProps = {
  columns: ColumnDef<AssignmentWithRelations>[];
  data: AssignmentWithRelations[];
  totalItems: number;
  pageSize: number;
  currentPage: number;
  isAdmin?: boolean;
};

interface GroupedAssignments {
  [levelId: string]: {
    levelName: string;
    levelPosition: number;
    courses: {
      [courseId: string]: {
        courseTitle: string;
        assignments: AssignmentWithRelations[];
      };
    };
  };
}

const ITEMS_PER_PAGE = 5;

// First, define the columns for the inner table
const innerColumns: ColumnDef<Assignment>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent"
        >
          Título
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
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
          className="hover:bg-transparent"
        >
          Tipo
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Badge 
        className={cn(
          "px-2.5 py-0.5 transition-colors ",
          row.original.isQuiz 
            ? "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200/50" 
            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200/50"
        )}
      >
        {row.original.isQuiz ? "Parcial" : "Tarea"}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent"
        >
          Estado
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Badge 
        variant="outline" 
        className={cn(
          "px-2.5 py-0.5 transition-colors ",
          getSubmissionStatus(row.original.submissions) === "SUBMITTED"
            ? "border-yellow-500 text-yellow-700 bg-yellow-50"
            : getSubmissionStatus(row.original.submissions) === "GRADED"
              ? "border-green-500 dark:text-success text-green-700 bg-green-50 dark:bg-transparent"
              : "border-secondary dark:text-orange-300 text-orange-500 bg-secondary/10"
        )}
      >
        {getSubmissionStatus(row.original.submissions) === "SUBMITTED"
          ? "Por calificar"
          : getSubmissionStatus(row.original.submissions) === "GRADED"
            ? "Calificado"
            : "Pendiente"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <InnerTableActionCell row={row} />
  },
];

// Add this new component for virtualized rendering
const VirtualizedAssignmentList = React.memo(({ assignments }: { assignments: Assignment[] }) => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: assignments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5
  });

  return (
    <div ref={parentRef} className="max-h-[400px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const assignment = assignments[virtualRow.index];
          return (
            <div
              key={assignment.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <AssignmentRow assignment={assignment} />
            </div>
          );
        })}
      </div>
    </div>
  );
});
VirtualizedAssignmentList.displayName = "VirtualizedAssignmentList";

// Memoized AssignmentTable component with your exact UI
const AssignmentTable = React.memo(({ assignments }: { assignments: Assignment[] }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: ITEMS_PER_PAGE,
  });

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  const table = useReactTable({
    data: assignments,
    columns: innerColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: { 
      sorting,
      pagination,
    },
  });

  return (
    <div className="rounded-md border dark:border-white/10">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="dark:hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="dark:text-white/80">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="dark:hover:bg-slate-800/50 dark:border-white/5">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="min-w-[100px] text-xs sm:text-sm dark:text-white/70">
                  <div className="truncate">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <GradientDivider className="dark:from-white/5 dark:to-white/5" />
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex-1 text-xs sm:text-sm text-muted-foreground dark:text-white/50">
          Página {table.getState().pagination.pageIndex + 1} de{' '}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-xs sm:text-sm hover:bg-transparent dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="text-xs sm:text-sm hover:bg-transparent dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
});

AssignmentTable.displayName = "AssignmentTable";

// Helper functions with your exact implementation
const getValueForSorting = (assignment: Assignment, key: string) => {
  switch (key) {
    case 'title':
      return assignment.title.toLowerCase();
    case 'isQuiz':
      return assignment.isQuiz;
    case 'status':
      return getStatusPriority(assignment.submissions);
    default:
      return '';
  }
};

const getStatusPriority = (submissions: Assignment['submissions']) => {
  if (submissions.some(s => s.status === "SUBMITTED")) return 2;
  if (submissions.some(s => s.status === "GRADED")) return 3;
  return 1; // PENDING
};

const getSubmissionStatus = (submissions: Assignment['submissions'] | null) => {
  if (!submissions) return "PENDING";
  if (submissions.some(s => s.status === "SUBMITTED")) return "SUBMITTED";
  if (submissions.some(s => s.status === "GRADED")) return "GRADED";
  return "PENDING";
};

const AssignmentRow = ({ assignment }: { assignment: Assignment }) => {
  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="font-medium">{assignment.title}</TableCell>
      <TableCell>
        <Badge 
          className={cn(
            "bg-opacity-10 border-0",
            assignment.isQuiz 
              ? "bg-orange-100 text-orange-500 hover:bg-orange-100" 
              : "bg-teal-100 text-teal-700 hover:bg-teal-100"
          )}
        >
          {assignment.isQuiz ? "Quiz" : "Assignment"}
        </Badge>
      </TableCell>
    </TableRow>
  );
};

// Your exact InnerTableActionCell implementation
const InnerTableActionCell = ({ row }: { row: { original: Assignment } }) => {
  const router = useRouter();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button 
          variant="ghost" 
          className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-all duration-200 hover:bg-transparent"
        >
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem 
          onClick={() => router.push(`/teacher/assignments/${row.original.id}/submissions`)}
          className="cursor-pointer sm:text-sm text-xs"
        >
          <ClipboardList className="h-4 w-4 mr-2" />
          Ver Entregas
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => router.push(`/teacher/assignments/${row.original.id}`)}
          className="cursor-pointer sm:text-sm text-xs"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function DataTable({
  columns,
  data,
  totalItems,
  pageSize,
  currentPage,
  isAdmin = false,
}: DataTableProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = React.useState("");
  const searchQuery = useDebounce(searchInput, 300);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    router.push(`?page=${page}`);
  }, [router]);

  // Optimize groupedAssignments calculation with level position sorting
  const groupedAssignments = useMemo(() => {
    if (!data.length) return {};
    
    // Create a map to store level positions for sorting
    const levelPositions: Record<string, number> = {};
    
    // First, gather all level IDs and their positions
    data.forEach(assignment => {
      if (assignment.chapter?.module?.course?.levelCourses) {
        assignment.chapter.module.course.levelCourses.forEach(lc => {
          // Store position if available, or use a high number as fallback
          levelPositions[lc.level.id] = lc.level.position || 9999;
        });
      }
    });
    
    // Build the grouped structure
    const groupedData = data.reduce((grouped: GroupedAssignments, assignment) => {
      if (searchQuery && !assignment.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return grouped;
      }
      
      // Handle case where levelCourses might be empty (some courses might not be assigned to levels)
      if (!assignment.chapter.module.course.levelCourses || 
          assignment.chapter.module.course.levelCourses.length === 0) {
        // Add to a special "Unassigned" level group for admin view
        const levelId = "unassigned";
        const courseId = assignment.chapter.module.course.id;
        
        if (!grouped[levelId]) {
          grouped[levelId] = {
            levelName: "Cursos sin nivel asignado",
            levelPosition: 10000, // Set a very high position to show at the end
            courses: {},
          };
        }
        
        if (!grouped[levelId].courses[courseId]) {
          grouped[levelId].courses[courseId] = {
            courseTitle: assignment.chapter.module.course.title,
            assignments: [],
          };
        }
        
        grouped[levelId].courses[courseId].assignments.push(assignment);
        return grouped;
      }
      
      // Normal case - course has levels
      assignment.chapter.module.course.levelCourses.forEach((lc) => {
        const levelId = lc.level.id;
        const courseId = assignment.chapter.module.course.id;

        if (!grouped[levelId]) {
          grouped[levelId] = {
            levelName: lc.level.name,
            levelPosition: levelPositions[levelId] || 9999,
            courses: {},
          };
        }

        if (!grouped[levelId].courses[courseId]) {
          grouped[levelId].courses[courseId] = {
            courseTitle: assignment.chapter.module.course.title,
            assignments: [],
          };
        }

        grouped[levelId].courses[courseId].assignments.push(assignment);
      });
      
      return grouped;
    }, {});
    
    return groupedData;
  }, [data, searchQuery]);
  
  // Get sorted level IDs
  const sortedLevelIds = useMemo(() => {
    return Object.keys(groupedAssignments).sort((a, b) => {
      return (groupedAssignments[a]?.levelPosition || 9999) - 
             (groupedAssignments[b]?.levelPosition || 9999);
    });
  }, [groupedAssignments]);

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md text-amber-600 dark:text-amber-400 text-sm border border-amber-200 dark:border-amber-800/50">
          <p>Modo administrador: Mostrando todas las tareas del sistema</p>
        </div>
      )}
      
      <div className="mb-4 sm:mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tareas..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 sm:text-sm text-xs"
          />
        </div>
      </div>

      <Accordion type="multiple" className="space-y-2 sm:space-y-4">
        {sortedLevelIds.map(levelId => {
          // Add safety check to prevent errors
          const levelData = groupedAssignments[levelId];
          if (!levelData) return null;
          
          return (
            <AccordionItem
              key={levelId}
              value={levelId}
              className="border rounded-lg px-2 overflow-hidden bg-gradient-to-r from-white to-slate-50 
                transition-all duration-300 ease-out shadow-sm hover:shadow-md
                dark:from-black/40 dark:to-black/20 dark:border-white/[0.05]"
            >
              <AccordionTrigger className="px-2 sm:px-4 hover:no-underline">
                <div className="flex items-center justify-between flex-1 pr-2 sm:pr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <span className="font-semibold text-xs sm:text-base text-left inline-block sm:hidden">
                      {levelData.levelName.length > 12
                        ? levelData.levelName.slice(0, 12) + "..."
                        : levelData.levelName}
                    </span>
                    <span className="font-semibold text-xs sm:text-base text-left sm:inline-block hidden">
                      {levelData.levelName}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary hover:bg-primary/15 text-xs sm:text-sm"
                    >
                      {Object.values(levelData.courses).reduce(
                        (acc, course) => acc + course.assignments.length,
                        0
                      )}{" "}
                      tareas
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 sm:pt-4 px-2 sm:px-4 space-y-2 sm:space-y-4">
                <Accordion type="multiple" className="space-y-2 sm:space-y-3">
                  {Object.entries(levelData.courses).map(
                    ([courseId, courseData]) => (
                      <AccordionItem
                        key={courseId}
                        value={courseId}
                        className="rounded-lg border bg-white overflow-hidden transition-all duration-200 ease-out hover:shadow-sm
                        dark:bg-black/20 dark:border-white/[0.05]"
                      >
                        <AccordionTrigger className="px-2 sm:px-4 hover:no-underline">
                          <div className="flex items-center gap-2 py-1.5 sm:py-2">
                            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-blue-50 flex items-center justify-center">
                              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-xs sm:text-base">
                              {courseData.courseTitle.length > 12
                                ? courseData.courseTitle.slice(0, 12) + "..."
                                : courseData.courseTitle}
                            </span>
                            <Separator
                              orientation="vertical"
                              className="mx-2 h-4"
                            />
                            <Badge
                              variant="secondary"
                              className="animate-in fade-in-50 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs sm:text-sm text-nowrap"
                            >
                              {courseData.assignments.length} tareas
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="overflow-hidden transition-all duration-200 ease-out">
                          <div className="transition-all duration-200 ease-out px-2">
                            <div className="max-w-[95%] mx-auto">
                              <AssignmentTable
                                assignments={courseData.assignments}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  )}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
