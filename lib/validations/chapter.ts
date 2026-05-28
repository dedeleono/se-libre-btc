import { ChapterType, Quiz, QuizQuestion, QuizOption } from "@prisma/client";

interface ChapterValidation {
    id: string;
    title: string;
    type: ChapterType;
    description: string | null;
    videoUrl: string | null;
    pdfUrl: string | null;
    richContent: string | null;
    youtubeUrl: string | null;
    quiz?: (Quiz & {
        questions: (QuizQuestion & {
            options: QuizOption[];
        })[];
    }) | null;
}

export const validateChapterForPublishing = (chapter: ChapterValidation): { isValid: boolean; message: string } => {
    if (!chapter.title) {
        return { isValid: false, message: "Title is required" };
    }

    if (chapter.type === ChapterType.QUIZ) {
        if (!chapter.quiz) {
            return { isValid: false, message: "Quiz configuration is required" };
        }

        if (chapter.quiz.questions.length === 0) {
            return { isValid: false, message: "Quiz requires at least one question" };
        }

        const invalidQuestion = chapter.quiz.questions.find((question) => {
            if (!question.prompt) return true;
            if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
                return question.options.length < 2 || !question.options.some((option) => option.isCorrect);
            }
            return false;
        });

        if (invalidQuestion) {
            return { isValid: false, message: "Quiz questions need prompts, valid options, and a correct answer" };
        }

        return { isValid: true, message: "" };
    }

    if (chapter.type === ChapterType.RESOURCE) {
        return chapter.pdfUrl || chapter.richContent
            ? { isValid: true, message: "" }
            : { isValid: false, message: "Resource chapters require a PDF or rich content" };
    }

    if (chapter.type === ChapterType.LIVE_SESSION) {
        return { isValid: true, message: "" };
    }

    const contentTypes = [chapter.videoUrl, chapter.youtubeUrl, chapter.pdfUrl, chapter.richContent].filter(Boolean);

    if (contentTypes.length > 1) {
        return { isValid: false, message: "Chapter can only have one primary content type" };
    }

    if (contentTypes.length === 0) {
        return { isValid: false, message: "Either video, YouTube URL, PDF, or rich text content is required" };
    }

    return { isValid: true, message: "" };
};