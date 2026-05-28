import { Quiz, QuizOption, QuizQuestion, QuizQuestionType } from "@prisma/client";
import { z } from "zod";

export type QuizWithQuestions = Quiz & {
    questions: (QuizQuestion & {
        options: QuizOption[];
    })[];
};

export const quizSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().nullable().optional(),
    passingScore: z.number().min(0).max(100).default(70),
    allowRetries: z.boolean().default(true),
    showCorrectAnswers: z.boolean().default(true),
});

export const quizQuestionSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),
    type: z.nativeEnum(QuizQuestionType),
    explanation: z.string().nullable().optional(),
    points: z.number().min(1).default(1),
    metadata: z.unknown().optional(),
});

export const quizOptionSchema = z.object({
    content: z.string().min(1, "Option content is required"),
    isCorrect: z.boolean().default(false),
    position: z.number().min(0),
});