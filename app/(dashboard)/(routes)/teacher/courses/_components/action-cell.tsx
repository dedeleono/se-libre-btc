"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { PencilIcon, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { ExtendedCourse } from "@/types/course";

interface ActionCellProps {
  course: ExtendedCourse;
}

export const ActionCell = ({ course }: ActionCellProps) => {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/courses/${course.id}`)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" /> View
        </DropdownMenuItem>
        {course.isOwnCourse && (
          <DropdownMenuItem
            onClick={() => router.push(`/teacher/courses/${course.id}`)}
            className="gap-2"
          >
            <PencilIcon className="h-4 w-4" /> Edit
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 