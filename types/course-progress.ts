export interface ModuleProgress {
  moduleTitle: string;
  totalStudents: number;
  completedStudents: number;
  completionRate: number;
}

export interface ChartCourseData extends CourseData {
  moduleProgress: ModuleProgress[];
  overallProgress: number;
}

export interface CourseData {
  courseId: string;
  title: string;
  level?: {
    name: string;
  };
  totalStudents: number;
  activeStudents: number;
  modules: Module[];
  completionRate: number;
}

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ModuleProgress;
    value: number;
  }>;
}

export interface CourseActivityData {
  courseId: string;
  title: string;
  level: string;
  totalStudents: number;
  activeStudents: number;
  moduleProgress: ModuleProgress[];
  overallProgress: number;
}

export interface Module {
  id: string;
  title: string;
  chapters: {
    id: string;
    studentProgress: {
      isCompleted: boolean;
    }[];
  }[];
} 