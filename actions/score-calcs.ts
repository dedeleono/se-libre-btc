import { Question, Answer, Assignment } from "@prisma/client";

export interface QuestionScore {
    questionId: string;
    score: number;
    maxPoints: number;
}

export const calculateTotalPoints = (
  items: { points?: number }[] | (Assignment & { questions?: Question[] })
): number => {
  // Handle array of items with points property
  if (Array.isArray(items)) {
    return items.reduce((total, item) => total + (item.points || 0), 0);
  }
  
  // Handle assignment with optional questions
  const item = items;
  // Check if questions property exists and has items
  if (item.questions?.length) {
    return item.questions.reduce((total, q) => total + (q.points || 0), 0);
  }
  
  // Fall back to maxPoints
  return item.maxPoints ?? 0;
};

// Add this helper function
export const isAssignmentWithQuestions = (
    value: any
): value is Assignment & { questions: Question[] } => {
    return !Array.isArray(value) && 'questions' in value;
};

export function calculateSubmissionScore(answers: Answer[]): number {
    // Get raw score out of 100
    return answers.reduce((total, answer) => total + (answer.score || 0), 0);
}

export function calculateScorePercentage(score: number, totalPoints: number): number {
    if (totalPoints === 0) return 0;
    return (score / totalPoints) * 100;
}

export const normalizeToAssignmentPoints = (
  pointValue: number, 
  assignmentMaxPoints: number
): number => {
  return normalizeScore(pointValue, 100, assignmentMaxPoints);
};

export const calculateTotalQuizPoints = (questions: Question[]): number => {
    return questions.reduce((total, question) => total + question.points, 0);
};

export const validateAndAdjustQuestionPoints = (
    questions: Question[],
    targetTotal: number = 100
): Question[] => {
    const totalPoints = calculateTotalQuizPoints(questions);
    if (totalPoints === 0) return questions;

    // Always adjust to sum exactly 100 first
    const scaleFactor = targetTotal / totalPoints;
    return questions.map(question => ({
        ...question,
        points: Math.round((question.points * scaleFactor) * 10) / 10
    }));
};

export const normalizeQuizScore = (
    score: number,
    totalQuestionPoints: number,
    quizWeight: number
): number => {
    // First get the percentage score out of total question points
    const percentage = calculateScorePercentage(score, totalQuestionPoints);
    
    // Then normalize to the quiz weight
    return (percentage / 100) * quizWeight;
};

export const normalizeSubmissionScore = (
  questionScores: QuestionScore[],
  assignmentMaxPoints: number
): number => {
  // Calculate total possible points (100 per question)
  const totalPossiblePoints = questionScores.length * 100;
  
  // Sum up actual scores
  const earnedPoints = questionScores.reduce((sum, q) => sum + q.score, 0);
  
  // Calculate the percentage achieved
  const percentageAchieved = (earnedPoints / totalPossiblePoints) * 100;
  
  // Apply percentage to assignment's max points
  return (percentageAchieved / 100) * assignmentMaxPoints;
};

// Add a unified normalization function
export const normalizeScore = (
  earnedPoints: number,
  totalPossiblePoints: number,
  targetScale: number = 100
): number => {
  if (totalPossiblePoints <= 0) return 0;
  const percentage = earnedPoints / totalPossiblePoints;
  return percentage * targetScale;
};