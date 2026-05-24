import { Course, Level } from "@prisma/client";

interface SimplifiedLevel {
  id: string;
  name: string;
}

export interface ExtendedCourse extends Course {
    studentCourses: {
        studentId: string;
    }[];
    teacher?: {
        id: string;
        name: string | null;
        image: string | null;
    } | null;
    modules: {
        id: string;
        chapters: {
            id: string;
        }[];
    }[];
    levelCourses?: {
        level: {
            id: string;
            name: string;
            students?: {
                id: string;
            }[];
        };
    }[];
    isOwnCourse?: boolean;
}