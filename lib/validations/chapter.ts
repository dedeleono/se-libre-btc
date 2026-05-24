import { Chapter, ChapterType, QuestionType } from "@prisma/client";

interface ChapterValidation {
    id: string;
    title: string;
    type: ChapterType;
    description: string | null;
    videoUrl: string | null;
    pdfUrl: string | null;
    richContent: string | null;
    youtubeUrl: string | null;
    assignments: {
        id: string;
        title: string;
        description: string | null;
        isQuiz: boolean;
        isOnline: boolean;
        questions: {
            id: string;
            type: QuestionType;
            content: string;
            options: {
                id: string;
                content: string;
            }[];
        }[];
    }[];
}

export const validateChapterForPublishing = (chapter: ChapterValidation): { isValid: boolean; message: string } => {
    if (!chapter.title) {
        return { isValid: false, message: "Title is required" };
    }

    if (chapter.type === ChapterType.LESSON) {
        if (!chapter.description) {
            return { isValid: false, message: "Description is required for lessons" };
        }

        // Check for multiple content types
        const contentTypes = [
            chapter.videoUrl,
            chapter.youtubeUrl,
            chapter.pdfUrl,
            chapter.richContent
        ].filter(Boolean);

        if (contentTypes.length > 1) {
            return { isValid: false, message: "Chapter can only have one type of content" };
        }

        if (contentTypes.length === 0) {
            return { isValid: false, message: "Either video, YouTube URL, PDF, or rich text content is required" };
        }

        return { isValid: true, message: "" };
    }

    // For QUIZ or ASSIGNMENT
    if (!chapter.assignments || chapter.assignments.length === 0) {
        return { isValid: false, message: "Assignment configuration is required" };
    }

    const assignment = chapter.assignments[0];

    if (!assignment.title) {
        return { isValid: false, message: "Assignment title is required" };
    }

    // if (!assignment.description) {
    //     return { isValid: false, message: "Assignment description is required" };
    // }

    // Online submission validation (both Quiz and Assignment)
    if (assignment.isOnline) {
        if (!assignment.questions || assignment.questions.length === 0) {
            return { isValid: false, message: "Online submissions require at least one question" };
        }

        const invalidQuestion = assignment.questions.find(q => {
            if (q.type === QuestionType.MULTIPLE_CHOICE) {
                return !q.options || q.options.length < 2;
            }
            return !q.content;
        });

        if (invalidQuestion) {
            return { isValid: false, message: "Multiple choice questions must have at least 2 options and all questions must have content" };
        }
    }

    return { isValid: true, message: "" };
};