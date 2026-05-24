"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { ExtendedCourse } from "@/types/course";
import { ActionCell } from "./action-cell";

export const columns: ColumnDef<ExtendedCourse>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "levels",
    header: "Assigned Levels",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.levelCourses?.map((lc) => (
          <Badge key={lc.level.id} variant="outline">
            {lc.level.name}
          </Badge>
        )) ?? <div>No levels assigned</div>}
      </div>
    ),
  },
  {
    accessorKey: "students",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Estudiantes
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.original.studentCourses.length} students</div>,
  },
  {
    accessorKey: "isPublished",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isPublished ? "default" : "secondary"}>
        {row.original.isPublished ? "Published" : "Draft"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell course={row.original} />,
  },
]; 