import { describe, expect, it } from "vitest";

import {
  countChapters,
  countCompletedChapters,
  findChapter,
  findNextPublishedChapterId,
  toCourseNavTree,
  type CourseNavTree,
} from "./course-nav-tree";

type Row = Parameters<typeof toCourseNavTree>[0];
type RowChapter = Row["modules"][number]["chapters"][number];

const chapter = (id: string, extra: Partial<RowChapter> = {}): RowChapter => ({
  id,
  title: `Title ${id}`,
  type: "LESSON",
  isIntro: false,
  isPublished: true,
  ...extra,
});

const tree = (modules: RowChapter[][]): CourseNavTree =>
  toCourseNavTree({
    id: "course-1",
    title: "Course",
    modules: modules.map((chapters, index) => ({ id: `m${index}`, title: `Module ${index}`, chapters })),
  });

describe("toCourseNavTree", () => {
  it("serializes only the outline, never lesson content or progress internals", () => {
    const row = {
      id: "course-1",
      title: "Course",
      description: "secret course description",
      imageUrl: "https://cdn/course.png",
      price: 100,
      attachments: [{ id: "a1", name: "Guide", url: "https://cdn/guide.pdf" }],
      modules: [
        {
          id: "m1",
          title: "Module 1",
          description: "module description",
          chapters: [
            {
              id: "c1",
              title: "Chapter 1",
              type: "LESSON",
              isIntro: true,
              isPublished: true,
              description: "chapter description",
              imageUrl: "https://cdn/c1.png",
              richContent: "<p>full lesson</p>",
              videoUrl: "https://cdn/c1.mp4",
              pdfUrl: "https://cdn/c1.pdf",
              youtubeUrl: "https://youtube.com/watch?v=c1",
              attachments: [{ id: "a2", url: "https://cdn/c1-extra.pdf" }],
              studentProgress: [{ isCompleted: true, userId: "u1", id: "p1" }],
            },
          ],
        },
      ],
    } as unknown as Row;

    const result = toCourseNavTree(row);
    const serialized = JSON.stringify(result);

    for (const key of [
      "richContent",
      "videoUrl",
      "pdfUrl",
      "youtubeUrl",
      "description",
      "imageUrl",
      "price",
      "attachments",
      "studentProgress",
      "userId",
    ]) {
      expect(serialized).not.toContain(`"${key}"`);
    }
    expect(result.modules[0].chapters[0]).toEqual({
      id: "c1",
      title: "Chapter 1",
      type: "LESSON",
      isIntro: true,
      isPublished: true,
      isCompleted: true,
    });
  });

  it.each([
    ["no progress rows", []],
    ["null progress", null],
    ["missing progress", undefined],
    ["an incomplete progress row", [{ isCompleted: false }]],
  ])("marks a chapter with %s as not completed", (_label, studentProgress) => {
    expect(tree([[chapter("a", { studentProgress })]]).modules[0].chapters[0].isCompleted).toBe(false);
  });

  it("marks a chapter with a completed progress row as completed", () => {
    expect(
      tree([[chapter("a", { studentProgress: [{ isCompleted: true }] })]]).modules[0].chapters[0].isCompleted,
    ).toBe(true);
  });
});

describe("findNextPublishedChapterId", () => {
  const twoModules = tree([[chapter("a"), chapter("b")], [chapter("c")]]);

  it("crosses into the next module after a module's last chapter", () => {
    expect(findNextPublishedChapterId(twoModules, "b")).toBe("c");
  });

  it("returns the next chapter in the same module", () => {
    expect(findNextPublishedChapterId(twoModules, "a")).toBe("b");
  });

  it("returns null after the course's last chapter", () => {
    expect(findNextPublishedChapterId(twoModules, "c")).toBeNull();
  });

  it("skips unpublished chapters", () => {
    const outline = tree([[chapter("a"), chapter("b", { isPublished: false })], [chapter("c")]]);
    expect(findNextPublishedChapterId(outline, "a")).toBe("c");
  });

  it("returns null for a chapter that is not in the course", () => {
    expect(findNextPublishedChapterId(twoModules, "elsewhere")).toBeNull();
  });

  it("skips empty modules", () => {
    expect(findNextPublishedChapterId(tree([[chapter("a")], [], [chapter("x")]]), "a")).toBe("x");
  });
});

describe("findChapter", () => {
  it("finds a chapter in any module, or null", () => {
    const outline = tree([[chapter("a")], [chapter("c")]]);
    expect(findChapter(outline, "c")?.title).toBe("Title c");
    expect(findChapter(outline, "missing")).toBeNull();
  });
});

describe("chapter counts", () => {
  it("counts every listed chapter and the completed ones", () => {
    const outline = tree([
      [chapter("a", { studentProgress: [{ isCompleted: true }] }), chapter("b")],
      [],
      [
        chapter("c", { studentProgress: [{ isCompleted: true }] }),
        chapter("d", { studentProgress: [{ isCompleted: false }] }),
      ],
    ]);
    expect(countChapters(outline)).toBe(4);
    expect(countCompletedChapters(outline)).toBe(2);
  });
});
