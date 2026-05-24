import { Submission, Assignment, Chapter, CourseModule, Course, Answer, Question, Attachment } from "@prisma/client";

export type SubmissionWithRelations = Submission & {
    assignment: Assignment & {
        chapter: Chapter & {
            module: CourseModule & {
                course: Course;
            };
        };
        questions: Question[];
    };
    answers: Answer[];
    attachments: Attachment[];
};