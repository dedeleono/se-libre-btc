import { QuizQuestionType } from "@prisma/client";
import { z } from "zod";

const quizOptionSchema = z.object({
  content: z.string().trim().min(1),
  isCorrect: z.boolean(),
  position: z.coerce.number().int().positive().optional(),
});

const quizQuestionMetadataSchema = z
  .object({
    correctAnswer: z.string().trim().optional(),
    acceptedAnswers: z.array(z.string().trim().min(1)).optional(),
    caseSensitive: z.boolean().optional(),
  })
  .nullable()
  .optional();

export const quizQuestionPayloadSchema = z
  .object({
    prompt: z.string().trim().min(1),
    type: z.nativeEnum(QuizQuestionType),
    explanation: z.string().trim().nullable().optional(),
    points: z.coerce.number().int().min(1).max(100).default(1),
    metadata: quizQuestionMetadataSchema,
    options: z.array(quizOptionSchema).default([]),
  })
  .superRefine((value, context) => {
    if (value.type === "FILL_IN_THE_BLANK") {
      const correctAnswer = value.metadata?.correctAnswer?.trim();
      const acceptedAnswers = value.metadata?.acceptedAnswers?.filter(Boolean) ?? [];

      if (!correctAnswer && acceptedAnswers.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fill-in-the-blank questions require a correct answer.",
          path: ["metadata", "correctAnswer"],
        });
      }

      return;
    }

    if (value.type === "TRUE_FALSE") {
      if (value.options.length !== 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "True/false questions require exactly two options.",
          path: ["options"],
        });
      }
    }

    if (value.type === "MULTIPLE_CHOICE" && value.options.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Multiple-choice questions require at least two options.",
        path: ["options"],
      });
    }

    const correctOptions = value.options.filter((option) => option.isCorrect);
    if (correctOptions.length !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Questions with options require exactly one correct answer.",
        path: ["options"],
      });
    }
  });

export type QuizQuestionPayload = z.infer<typeof quizQuestionPayloadSchema>;
