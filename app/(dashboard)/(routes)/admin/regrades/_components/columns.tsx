"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { formatDistance } from "date-fns";

// Create a proper React component for the actions cell
function ActionCell({ submission }: { submission: any }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAction = async (approved: boolean) => {
    try {
      setIsLoading(true);
      await axios.post(`/api/admin/submissions/${submission.id}/approve-regrade`, {
        approved,
        pendingGradeId: submission.gradeHistory[0]?.id
      });
      
      toast.success(approved ? "Regrade approved" : "Regrade rejected");
      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to process request");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex space-x-2">
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => handleAction(true)}
        disabled={isLoading}
      >
        Approve
      </Button>
      <Button 
        size="sm" 
        variant="destructive" 
        onClick={() => handleAction(false)}
        disabled={isLoading}
      >
        Reject
      </Button>
    </div>
  );
}

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "student.name",
    header: "Student",
  },
  {
    accessorKey: "assignment.title",
    header: "Assignment",
  },
  {
    accessorKey: "assignment.chapter.module.course.title",
    header: "Course",
  },
  {
    accessorKey: "score",
    header: "Current Score",
    cell: ({ row }) => {
      return <div>{row.original.score}</div>;
    }
  },
  {
    accessorKey: "gradeHistory[0].score",
    header: "Proposed Score",
    cell: ({ row }) => {
      return <div>{row.original.gradeHistory[0]?.score}</div>;
    }
  },
  {
    accessorKey: "gradeHistory[0].teacher.name",
    header: "Requested By",
  },
  {
    accessorKey: "regradeReason",
    header: "Reason",
    cell: ({ row }) => {
      const reason = row.original.regradeReason;
      return (
        <div className="max-w-[300px] truncate" title={reason}>
          {reason}
        </div>
      );
    }
  },
  {
    accessorKey: "updatedAt",
    header: "Requested",
    cell: ({ row }) => {
      return <div>{formatDistance(new Date(row.original.updatedAt), new Date(), { addSuffix: true })}</div>;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const submission = row.original;
      return <ActionCell submission={submission} />;
    }
  }
]; 