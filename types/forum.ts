import { User, Level, Course } from "@prisma/client";

interface Forum {
  id: string;
  title: string;
  content: string;
  authorId: string;
  levelId: string;
  courseId?: string;
  meetingLink?: string;
  meetingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  author: User;
  level: Level;
  course?: Course;
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