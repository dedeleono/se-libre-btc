import { Course } from "@prisma/client";

export interface ExtendedCourse extends Course {
    enrollments: {
        userId: string;
    }[];
    modules: {
        id: string;
        chapters: {
            id: string;
        }[];
    }[];
    learningPaths?: {
        learningPath: {
            id: string;
            title: string;
            enrollments?: {
                id: string;
            }[];
        };
    }[];
}