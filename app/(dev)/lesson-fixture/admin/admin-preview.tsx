"use client";

import dynamic from "next/dynamic";
import type { Chapter } from "@prisma/client";

// Client-only: the admin forms import the Lexical editor, which is browser-only.
const ChapterDescriptionForm = dynamic(
  () => import("@/app/(dashboard)/(routes)/admin/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/_components/chapter-description-form").then((m) => m.ChapterDescriptionForm),
  { ssr: false },
);
const ChapterContentForm = dynamic(
  () => import("@/app/(dashboard)/(routes)/admin/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/_components/chapter-content-form").then((m) => m.ChapterContentForm),
  { ssr: false },
);

const ids = { courseId: "fixture-course", moduleId: "fixture-module", chapterId: "fixture-chapter" };

export function AdminPreview({ chapter }: { chapter: Chapter }) {
  return (
    <>
      <ChapterDescriptionForm initialData={chapter} {...ids} />
      <ChapterContentForm initialData={chapter} {...ids} />
    </>
  );
}
