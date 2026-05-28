export interface DashboardCourseSummary {
    id: string;
    title: string;
    completedChapters: number;
    totalChapters: number;
}

export interface DashboardLearningPathSummary {
    id: string;
    title: string;
    completedCourses: number;
    totalCourses: number;
}

export interface DashboardCohortSummary {
    id: string;
    title: string;
    upcomingLiveSessions: number;
}

export interface DashboardQuizAttemptSummary {
    id: string;
    quizTitle: string;
    scorePercent: number | null;
    passed: boolean | null;
    completedAt: Date | null;
}

export interface StudentDashboardData {
    id: string;
    firstName: string | null;
    name: string | null;
    email: string;
    courses: DashboardCourseSummary[];
    learningPaths: DashboardLearningPathSummary[];
    cohorts: DashboardCohortSummary[];
    quizAttempts: DashboardQuizAttemptSummary[];
}
