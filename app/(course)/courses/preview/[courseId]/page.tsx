import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, CheckCircle, ChevronLeft, Clock, FileText, PlayCircle, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EnrollmentButton } from "@/components/enrollment-button";
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";

export default async function CoursePreviewPage({
  params,
}: {
  params: { courseId: string };
}) {
  const t = getServerMessages();
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      courseCategory: {
        include: {
          category: true,
        },
      },
      contributors: {
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
      enrollments: {
        select: { id: true },
      },
      attachments: true,
      modules: {
        orderBy: { position: "asc" },
        include: {
          chapters: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              isIntro: true,
              isPublished: true,
              startTime: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    redirect("/courses");
  }

  const publishedChapters = course.modules.flatMap((module) =>
    module.chapters.filter((chapter) => chapter.isPublished || chapter.isIntro)
  );
  const introChapter = publishedChapters.find((chapter) => chapter.isIntro);
  const instructor = course.contributors[0]?.user;

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Button asChild variant="ghost" className="px-0">
              <Link href="/courses">
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t.course.backToCatalog}
              </Link>
            </Button>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {course.courseCategory.map(({ category }) => (
                  <Badge key={category.id} variant="secondary">
                    {category.name}
                  </Badge>
                ))}
                <Badge variant="outline">{course.difficulty.replace("_", " ")}</Badge>
                <Badge variant="outline">{course.deliveryMode.replace("_", " ")}</Badge>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                  {course.title}
                </h1>
                {course.shortDescription && (
                  <p className="max-w-3xl text-lg text-muted-foreground">
                    {course.shortDescription}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {t.course.modulesCount(course.modules.length)}
                </span>
                <span className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  {t.course.lessonsCount(publishedChapters.length)}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t.course.enrolledCount(course.enrollments.length)}
                </span>
                {course.estimatedDuration && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {course.estimatedDuration}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {course.imageUrl ? (
                <Image
                  src={course.imageUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <BookOpen className="h-12 w-12" />
                </div>
              )}
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="text-2xl font-bold">{t.common.free}</p>
                {instructor?.name && (
                  <p className="text-sm text-muted-foreground">{t.course.byInstructor(instructor.name)}</p>
                )}
              </div>
              <div className="grid gap-2">
                <EnrollmentButton
                  productId={course.id}
                  productType="course"
                  redirectTo={`/courses/${course.id}`}
                  className="w-full"
                >
                  {t.course.enrollForFree}
                </EnrollmentButton>
                {introChapter && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/courses/${course.id}/chapters/${introChapter.id}`}>
                      {t.course.previewLesson}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {course.description && (
            <Card className="p-6">
              <h2 className="mb-3 text-2xl font-semibold">{t.course.aboutThisCourse}</h2>
              <div className="prose max-w-none text-muted-foreground">
                <p>{course.description}</p>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="mb-5 text-2xl font-semibold">{t.course.courseContent}</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {course.modules.map((module, index) => (
                <AccordionItem key={module.id} value={module.id} className="rounded-md border px-4">
                  <AccordionTrigger>
                    <span className="text-left">
                      {t.course.moduleNumber(index + 1)}: {module.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pb-2">
                      {module.chapters.map((chapter) => (
                        <div key={chapter.id} className="flex items-center justify-between rounded-md bg-muted/40 p-3">
                          <div className="flex items-center gap-3">
                            {chapter.type === "QUIZ" ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <PlayCircle className="h-4 w-4 text-sky-600" />
                            )}
                            <span>{chapter.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {chapter.isIntro && <Badge variant="secondary">{t.course.preview}</Badge>}
                            <Badge variant="outline">{chapter.type.replace("_", " ")}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">{t.course.includedResources}</h2>
            <div className="space-y-3">
              {course.attachments.length ? (
                course.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    className="flex items-center gap-3 rounded-md border p-3 text-sm hover:bg-muted"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="line-clamp-1">{attachment.name}</span>
                  </a>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t.course.noDownloadableResources}</p>
              )}
            </div>
          </Card>
        </aside>
      </section>
    </main>
  );
}
