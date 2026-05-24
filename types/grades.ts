import { User, Level, Course, Assignment, StudentAssignmentScore, StudentCourseScore, StudentLevelScore } from "@prisma/client";

// export type StudentGradeData = User & {
//     studentLevel: Level | null;
//     assignmentScores: (StudentAssignmentScore & {
//         assignment: Assignment;
//     })[];
//     courseScores: (StudentCourseScore & {
//         course: Course;
//     })[];
//     levelScores: (StudentLevelScore & {
//         level: Level;
//     })[];
// };

export interface StudentGradeData {
    assignmentScores: {
        score: number;
        maxScore: number;
        assignment: {
            id: string;
            title: string;
            chapter: {
                module: {
                    course: {
                        id: string;
                        title: string;
                    };
                };
            };
        };
    }[];
    courseScores: {
        courseId: string;
        score: number;
        totalPoints: number;
        course: {
            id: string;
            title: string;
        };
    }[];
    levelScores: {
        score: number;
        level: {
            id: string;
            name: string;
        };
    }[];
}

export interface GradeCalculationParams {
    submissionId: string;
    studentId: string;
    courseId: string;
    levelId: string | null;
}

interface GradeableItem {
    id: string;
    maxPoints: number;
    earnedPoints: number;
}

interface GradingResult {
    score: number;
    percentage: number;
    isPassing: boolean;
}

interface GradingScale {
    passingThreshold: number;
    excellentThreshold: number;
}

// Add this to your existing types/grades.ts file
export const calculateGrade = (
    earnedPoints: number,
    maxPoints: number,
    scale: GradingScale = { passingThreshold: 60, excellentThreshold: 90 }
): GradingResult => {
    const percentage = (earnedPoints / maxPoints) * 100;
    return {
        score: earnedPoints,
        percentage,
        isPassing: percentage >= scale.passingThreshold
    };
};

// Add these types to your existing types/grades.ts file
export interface PointsCalculation {
  earnedPoints: number;
  totalPoints: number;
  percentage: number;
}

export interface NormalizedScore {
  raw: number;         // The raw score (e.g., 85)
  normalized: number;  // The normalized score (e.g., 8.5 if max is 10)
  percentage: number;  // The percentage (e.g., 85%)
}

// Enhanced grading function
export const calculateGradeWithDetails = (
  earnedPoints: number,
  maxPoints: number,
  scale: GradingScale = { passingThreshold: 60, excellentThreshold: 90 }
): GradingResult & NormalizedScore => {
  const percentage = maxPoints > 0 ? (earnedPoints / maxPoints) * 100 : 0;
  return {
    score: earnedPoints,
    raw: earnedPoints,
    normalized: maxPoints > 0 ? earnedPoints : 0, 
    percentage,
    isPassing: percentage >= scale.passingThreshold
  };
};