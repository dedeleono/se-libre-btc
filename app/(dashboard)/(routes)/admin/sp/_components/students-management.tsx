"use client";

import { useState } from "react";
import { LevelsDataTable } from "./levels-table";
import { StudentsDataTable } from "./students-data-table";

interface StudentManagementProps {
  unassignedUsers: any;
  data: any;
  students: any;
}

export function StudentManagement({
  unassignedUsers,
  data,
  students
}: StudentManagementProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gestión de Estudiantes</h2>
        
      </div>
      <LevelsDataTable unassignedUsers={unassignedUsers} data={data} />
      
    </div>
  );
}
