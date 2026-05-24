import { Assignment, 
Chapter, 
Course, 
Level, 
LevelCourse, 
CourseModule, 
Submission, 
User, 
QuestionType } from "@prisma/client";
import { z } from "zod";

export type AssignmentWithRelations = Assignment & {
    chapter: Chapter & {
        module: CourseModule & {
            course: Course & {
                levelCourses: (LevelCourse & {
                    level: Level;
                })[];
            };
        };
    };
    submissions: Submission[];
    creator?: User;
};

export interface AssignmentInterface {
    id: string;
    title: string;
    description: string | null;
    maxPoints: number | null;
    isQuiz: boolean;
    isOnline: boolean;
    timer: number | null;
    deadline: Date | null;
    questions?: Question[];
    chapterId: string;
}

export interface Question {
    id: string;
    content: string;
    type: QuestionType;
    points: number;
    options?: QuestionOption[];
    correctOption?: string | null;
    position: number;
}

export interface QuestionOption {
    id: string;
    content: string;
    questionId: string;
}

export interface QuestionResponse extends Question {
    options: QuestionOption[];
    assignmentId: string;
    createdAt: Date;
    updatedAt: Date;
    matchingConfig?: {
        id: string;
        scoringPolicy: string;
        allowReuse: boolean;
        shuffleChoices: boolean;
    };
    matchingPrompts?: {
        id: string;
        content: string;
        position: number;
    }[];
    matchingChoices?: {
        id: string;
        content: string;
        position: number;
    }[];
    matchingPairs?: {
        id: string;
        promptId: string;
        choiceId: string;
    }[];
}

// Zod schemas for validation
export const assignmentSchema = {
    title: z.object({
        title: z.string().min(1, "Title is required"),
    }),
    description: z.object({
        description: z.string().nullable(),
    }),
    points: z.object({
        maxPoints: z.number().min(0, "Points must be non-negative").nullable(),
    }),
    submissionMode: z.object({
        isOnline: z.boolean(),
    }),
    timer: z.object({
        timer: z.number().min(0).nullable(),
    }),
    deadline: z.object({
        deadline: z.string().nullable(),
    }),
    quizType: z.object({
        isQuiz: z.boolean(),
    }),
};

export const assignmentPatchSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    maxPoints: z.number().min(0).optional(),
    isOnline: z.boolean().optional(),
    isQuiz: z.boolean().optional(),
    timer: z.number().min(0).nullable().optional(),
    deadline: z.string().nullable().optional(),
});

export type AssignmentFormProps = {
    initialData?: Assignment & {
        questions?: QuestionResponse[];
    };
    chapterId: string;
    defaultIsQuiz?: boolean;
};

export type AssignmentFormComponentProps = {
    initialData: AssignmentInterface | null;
    assignmentId: string;
    chapterId: string;
};