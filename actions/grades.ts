import { prisma } from "@/lib/db";
import { GradeCalculationParams } from "@/types/grades";
import { calculateTotalPoints } from "@/actions/score-calcs";

interface Submission {
    id: string;
    status: "PENDING" | "SUBMITTED" | "GRADED";
    score: number | null;
    assignment: {
        id: string;
        title: string;
        maxPoints: number | null;
        chapter: {
            type: "LESSON" | "QUIZ" | "ASSIGNMENT";
            module: {
                course: {
                    id: string;
                    title: string;
                };
            };
        };
    };
}

interface CourseScoreBreakdown {
    assignmentsScore: number;
    quizScore: number;
    totalScore: number;
}

interface StudentCourse {
    id: string;
    title: string;
    submissions: Submission[];
}

export async function updateScoresAfterGrading({
    submissionId,
    studentId,
    courseId,
    levelId
}: GradeCalculationParams): Promise<void> {
    // Update course score
    const courseScores = await prisma.studentAssignmentScore.groupBy({
        by: ['studentId'],
        where: {
            studentId: studentId,
            assignment: {
                chapter: {
                    module: {
                        courseId: courseId
                    }
                }
            }
        },
        _sum: {
            score: true
        }
    });

    const earnedPoints = courseScores[0]?._sum.score || 0;

    // Calculate percentage and normalize to 100 points
    const totalPossiblePoints = await prisma.assignment.findMany({
        where: {
            chapter: {
                module: {
                    courseId: courseId
                }
            }
        },
        select: {
            maxPoints: true
        }
    });

    const totalMaxPoints = totalPossiblePoints.reduce((sum, assignment) => 
        sum + (assignment.maxPoints ?? 0), 0);

    const courseScore = totalMaxPoints > 0 ? (earnedPoints / totalMaxPoints) * 100 : 0;

    // Update or create course score
    await prisma.studentCourseScore.upsert({
        where: {
            studentId_courseId: {
                studentId,
                courseId
            }
        },
        create: {
            studentId,
            courseId,
            score: courseScore
        },
        update: {
            score: courseScore
        }
    });

    // Only proceed with level score update if levelId exists
    if (!levelId) return;

    // Update level score
    const coursesInLevel = await prisma.levelCourse.findMany({
        where: { levelId },
        include: {
            course: {
                include: {
                    studentScores: {
                        where: { studentId }
                    }
                }
            }
        }
    });

    const levelScore = coursesInLevel.reduce((acc, lc) => {
        const courseScore = lc.course.studentScores[0]?.score || 0;
        return acc + courseScore;
    }, 0) / coursesInLevel.length;

    await prisma.studentLevelScore.upsert({
        where: {
            studentId_levelId: {
                studentId,
                levelId
            }
        },
        create: {
            studentId,
            levelId,
            score: levelScore
        },
        update: {
            score: levelScore
        }
    });
}

export async function updateModuleAndCourseScores({
    studentId,
    moduleId,
    courseId,
}: {
    studentId: string;
    moduleId: string;
    courseId: string;
}) {
    try {
        if (!prisma?.studentModuleScore) {
            console.error("StudentModuleScore model not available:", {
                availableModels: Object.keys(prisma || {})
            });
            throw new Error("StudentModuleScore model not properly initialized");
        }

        const moduleData = await prisma.courseModule.findUnique({
            where: { id: moduleId },
            include: {
                chapters: {
                    include: {
                        assignments: {
                            include: {
                                studentAssignmentScores: {
                                    where: { studentId }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!moduleData) {
            console.error("Module not found:", moduleId);
            return;
        }

        // Calculate total points and earned points for the module
        const totalModulePoints = moduleData.chapters.reduce((moduleTotal, chapter) => 
            moduleTotal + chapter.assignments.reduce((chapterTotal, assignment) => 
                chapterTotal + (assignment.maxPoints ?? 0), 0), 0);

        const earnedModulePoints = moduleData.chapters.reduce((moduleEarned, chapter) => 
            moduleEarned + chapter.assignments.reduce((chapterEarned, assignment) => 
                chapterEarned + (assignment.studentAssignmentScores[0]?.score ?? 0), 0), 0);

        console.log("About to upsert with:", {
            studentId,
            moduleId,
            earnedModulePoints,
            totalModulePoints
        });

        // Try the upsert in a transaction to ensure data consistency
        await prisma.$transaction([
            prisma.studentModuleScore.upsert({
                where: {
                    studentId_moduleId: {
                        studentId,
                        moduleId
                    }
                },
                create: {
                    studentId,
                    moduleId,
                    score: earnedModulePoints,
                    totalPoints: totalModulePoints
                },
                update: {
                    score: earnedModulePoints,
                    totalPoints: totalModulePoints
                }
            })
        ]);

        // Get all module scores for this course
        const moduleScores = await prisma.studentModuleScore.findMany({
            where: {
                studentId,
                module: {
                    courseId
                }
            }
        });

        const totalCoursePoints = moduleScores.reduce((sum, ms) => sum + (ms.totalPoints ?? 0), 0);
        const earnedCoursePoints = moduleScores.reduce((sum, ms) => sum + (ms.score ?? 0), 0);

        console.log("Course calculation:", {
            courseId,
            totalCoursePoints,
            earnedCoursePoints
        });

        await prisma.studentCourseScore.upsert({
            where: {
                studentId_courseId: {
                    studentId,
                    courseId
                }
            },
            create: {
                studentId,
                courseId,
                score: earnedCoursePoints,
                totalPoints: totalCoursePoints
            },
            update: {
                score: earnedCoursePoints,
                totalPoints: totalCoursePoints
            }
        });
    } catch (error) {
        console.error("Error in updateModuleAndCourseScores:", {
            error,
            studentId,
            moduleId,
            courseId,
            prismaInitialized: !!prisma
        });
        throw error;
    }
}

export const calculateCourseScoreBreakdown = (
    submissions: Submission[],
    weights = { assignments: 70, quiz: 30 }
): CourseScoreBreakdown => {
    const assignments = submissions.filter(s => s.assignment.chapter.type === "ASSIGNMENT");
    const quiz = submissions.find(s => s.assignment.chapter.type === "QUIZ");

    // Calculate based on configured weights
    const rawAssignmentPoints = assignments.reduce((sum, s) => sum + (s.score || 0), 0);
    const maxAssignmentPoints = assignments.reduce((sum, s) => sum + (s.assignment.maxPoints || 0), 0);
    
    const assignmentsScore = maxAssignmentPoints > 0 
        ? (rawAssignmentPoints / maxAssignmentPoints) * weights.assignments 
        : 0;

    const quizScore = quiz 
        ? ((quiz.score || 0) / (quiz.assignment.maxPoints || 1)) * weights.quiz 
        : 0;

    return {
        assignmentsScore: Math.round(assignmentsScore * 10) / 10,
        quizScore: Math.round(quizScore * 10) / 10,
        totalScore: Math.round((assignmentsScore + quizScore) * 10) / 10
    };
};

export const groupAssignmentsByCourse = (data: Submission[], studentCourses: StudentCourse[]) => {
    const groupedData: Record<string, { courseTitle: string; assignments: Submission[] }> = {};

    studentCourses.forEach((course) => {
        groupedData[course.id] = {
            courseTitle: course.title,
            assignments: []
        };
    });

    data.forEach((submission) => {
        const courseId = submission.assignment.chapter.module.course.id;
        if (groupedData[courseId]) {
            groupedData[courseId].assignments.push(submission);
        }
    });

    return groupedData;
};

// Add level score calculation
export const calculateLevelAverage = (courses: { submissions: Submission[] }[]): number => {
    if (courses.length === 0) return 0;

    const courseScores = courses.map(course => {
        const scores = calculateCourseScoreBreakdown(course.submissions);
        return scores.totalScore; // Each course is already out of 100
    });

    // Calculate average (sum of scores divided by number of courses)
    const average = courseScores.reduce((acc, score) => acc + score, 0) / courses.length;

    return Math.round(average * 10) / 10;
};