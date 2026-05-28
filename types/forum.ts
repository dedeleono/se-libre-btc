import { User, LearningPath, Course, Cohort } from "@prisma/client";

interface Forum {
  id: string;
  title: string;
  content: string;
  authorId: string;
  learningPathId?: string | null;
  cohortId?: string | null;
  courseId?: string;
  meetingLink?: string;
  meetingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  author: User;
  learningPath?: LearningPath | null;
  cohort?: Cohort | null;
  course?: Course | null;
  comments: ForumComment[];
}

interface ForumComment {
  id: string;
  content: string;
  authorId: string;
  forumId: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  author: User;
  replies: ForumComment[];
}