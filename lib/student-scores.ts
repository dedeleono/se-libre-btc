import { prisma } from "@/lib/db";

interface CourseScoreBreakdown {
  assignmentsScore: number;
  quizScore: number;
  totalScore: number;
}

export interface FormattedCourse {
  id: string;
  title: string;
  submissions: any[];
}

export interface StudentScoresData {
  studentData: any | null;
  submissions: any[];
  studentCourses: any[];
  formattedCourses: FormattedCourse[];
  metrics: {
    activeCourses: number;
    submittedAssignments: number;
    totalSubmittedAssignments: number;
    averageScore: number;
  };
}

/**
 * Get all student submissions
 */
const getStudentSubmissions = async (userId: string) => {
  try {
    return await prisma.submission.findMany({
      where: {
        studentId: userId,
      },
      include: {
        assignment: {
          include: {
            chapter: {
              include: {
                module: {
                  include: {
                    course: true,
                  },
                },
              },
            },
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
        attachments: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });
  } catch (error) {
    console.error("[GET_STUDENT_SUBMISSIONS]", error);
    return [];
  }
};

/**
 * Get student courses
 */
const getStudentCourses = async (userId: string) => {
  try {
    return await prisma.studentCourse.findMany({
      where: {
        studentId: userId,
      },
      include: {
        course: true,
      },
    });
  } catch (error) {
    console.error("[GET_STUDENT_COURSES]", error);
    return [];
  }
};

/**
 * Get student profile data and recent scores
 */
const getStudentData = async (userId: string) => {
  try {
    const studentData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentLevel: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
        assignmentScores: {
          orderBy: {
            submittedAt: "desc",
          },
          // Only recent ones for display purposes
          take: 5,
          include: {
            assignment: true,
          },
        },
      },
    });

    if (!studentData) return null;

    // Get the submissions for these scores
    const scoresWithSubmissions = await Promise.all(
      studentData.assignmentScores.map(async (score) => {
        const submission = await prisma.submission.findUnique({
          where: {
            studentId_assignmentId: {
              studentId: userId,
              assignmentId: score.assignmentId,
            },
          },
          select: {
            id: true,
          },
        });
        
        if (!submission) {
          console.warn('No submission found for score:', {
            scoreId: score.id,
            assignmentId: score.assignmentId,
          });
          return null;
        }

        return {
          id: score.id,
          score: score.score,
          submittedAt: score.submittedAt,
          submission: submission,
          assignment: {
            id: score.assignment.id,
            title: score.assignment.title,
          },
        };
      })
    ).then(scores => scores.filter((score): score is NonNullable<typeof score> => score !== null));

    return {
      ...studentData,
      assignmentScores: scoresWithSubmissions,
    };
  } catch (error) {
    console.error("[GET_STUDENT_DATA]", error);
    return null;
  }
};

/**
 * Calculate course score breakdown
 */
export const calculateCourseScoreBreakdown = (submissions: any[]): CourseScoreBreakdown => {
  const assignments = submissions.filter(s => s.assignment.chapter.type === "ASSIGNMENT");
  const quiz = submissions.find(s => s.assignment.chapter.type === "QUIZ");

  // Sum up actual assignment scores (max 70)
  const assignmentsScore = assignments.reduce((sum, s) => sum + (s.score || 0), 0);
  
  // Get quiz score (max 30)
  const quizScore = quiz?.score || 0;

  return {
    assignmentsScore: Math.round(assignmentsScore * 10) / 10,
    quizScore: Math.round(quizScore * 10) / 10,
    totalScore: Math.round((assignmentsScore + quizScore) * 10) / 10
  };
};

/**
 * Calculate level average from all courses
 */
export const calculateLevelAverage = (courses: { submissions: any[] }[]): number => {
  if (courses.length === 0) return 0;
  
  const courseScores = courses.map(course => {
    const scores = calculateCourseScoreBreakdown(course.submissions);
    return scores.totalScore;
  });
  
  // Calculate average (sum of scores divided by number of courses)
  const average = courseScores.reduce((acc, score) => acc + score, 0) / courses.length;
  
  return Math.round(average * 10) / 10;
};

/**
 * Group assignments by course
 */
export const groupAssignmentsByCourse = (data: any[], studentCourses: any[]) => {
  const groupedData: Record<string, { courseTitle: string; assignments: any[] }> = {};
  
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

/**
 * Calculate data for monthly progress chart
 */
export const calculateMonthlyProgress = (scores: any[]) => {
  const monthlyData = new Map<string, { total: number; count: number }>();

  // Get current year
  const currentYear = new Date().getFullYear();

  // Initialize all months from January to current month
  const currentMonth = new Date().getMonth();
  for (let month = 0; month <= currentMonth; month++) {
    const monthKey = `${currentYear}-${month}`;
    monthlyData.set(monthKey, { total: 0, count: 0 });
  }

  // Process scores
  scores.forEach((score) => {
    const date = new Date(score.submittedAt);
    // Only process scores from current year
    if (date.getFullYear() === currentYear) {
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const current = monthlyData.get(monthKey)!;
      monthlyData.set(monthKey, {
        total: current.total + score.score,
        count: current.count + 1,
      });
    }
  });

  // Convert to array and format
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return Array.from({ length: currentMonth + 1 }, (_, index) => {
    const monthKey = `${currentYear}-${index}`;
    const data = monthlyData.get(monthKey)!;
    const average = data.count > 0 ? data.total / data.count : 0;
    
    return {
      name: monthNames[index],
      average: Math.round(average * 10) / 10,
    };
  });
};

/**
 * Get student scores and data - This is a server-side data fetching utility
 */
export const getStudentScoresData = async (userId: string): Promise<StudentScoresData | null> => {
  try {
    if (!userId) return null;
    
    // Get all the necessary data
    const studentData = await getStudentData(userId);
    const submissions = await getStudentSubmissions(userId);
    const studentCourses = await getStudentCourses(userId);
    
    if (!studentData) return null;
    
    // Format courses with their submissions
    const formattedCourses = studentCourses.map((sc) => ({
      id: sc.course.id,
      title: sc.course.title,
      submissions: submissions.filter(
        (s) => s.assignment.chapter.module.course.id === sc.course.id
      ),
    }));
    
    // Calculate metrics
    const activeCourses = studentCourses.length;
    const submittedAssignments = submissions.filter(s => s.status === "SUBMITTED").length;
    const totalSubmittedAssignments = studentData.assignmentScores?.length ?? 0;
    
    // Calculate average score
    const averageScore = calculateLevelAverage(formattedCourses.map(course => ({ 
      submissions: course.submissions
    })));
    
    return {
      studentData,
      submissions,
      studentCourses,
      formattedCourses,
      metrics: {
        activeCourses,
        submittedAssignments,
        totalSubmittedAssignments,
        averageScore
      }
    };
  } catch (error) {
    console.error("[GET_STUDENT_SCORES_ERROR]", error);
    return null;
  }
};

