import { redirect } from "next/navigation";
import Link from "next/link";
import { LockKeyhole, RotateCcw } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProgress } from "@/actions/get-progress";
import { ensureCertificate } from "@/actions/certificate";
import { getCertificateEligibility, type CertificateEligibility } from "@/lib/certificate-eligibility";
import { getServerMessages } from "@/lib/i18n-server";
import { CompletionHero } from "./_components/completion-hero";
import { CertificateStudio } from "./_components/certificate-studio";
import { MaverickCta } from "./_components/maverick-cta";
import { GuateLibreFooter } from "./_components/guate-libre-footer";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CourseCompletePage(props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;
  const [course, enrollment, progress, eligibility] = await Promise.all([
    prisma.course.findUnique({
      where: { id: params.courseId },
      select: { id: true, title: true },
    }),
    prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId: params.courseId } },
    }),
    getProgress(userId, params.courseId),
    getCertificateEligibility(userId, params.courseId),
  ]);
  if (!course) redirect("/courses");

  // Guard: only finishers. Accept a recorded completedAt OR live 100%.
  if (!enrollment?.completedAt && progress < 100) {
    redirect(`/courses/${params.courseId}`);
  }

  // Finished, but the final quiz isn't aced yet: no certificate. Show why and
  // point them back at the quiz to retry.
  if (!eligibility.eligible) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 pb-16">
        <CompletionHero courseTitle={course.title} />
        <CertificateLockedCard eligibility={eligibility} />
        <Separator className="my-2" />
        <MaverickCta />
        <GuateLibreFooter />
      </div>
    );
  }

  const cert = await ensureCertificate(params.courseId);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 pb-16">
      <CompletionHero courseTitle={course.title} />

      <CertificateStudio
        certId={cert.id}
        serial={cert.serial}
        initialName={cert.recipientName}
        initialDesign={cert.design}
        initialVersion={new Date(cert.updatedAt).getTime()}
      />

      <Separator className="my-2" />

      <MaverickCta />

      <GuateLibreFooter />
    </div>
  );
}

function CertificateLockedCard({ eligibility }: { eligibility: CertificateEligibility }) {
  const t = getServerMessages().completion;

  return (
    <Card className="border-2 border-foreground p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[2px] border-2 border-foreground bg-secondary">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="font-[var(--font-display)] text-3xl uppercase leading-none">
              {t.certificateLockedTitle}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t.certificateLockedScoreDescription(eligibility.bestFinalQuizScorePercent)}
            </p>
          </div>
        </div>

        {eligibility.finalQuizHref && (
          <Button asChild className="shrink-0">
            <Link href={eligibility.finalQuizHref}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t.retryFinalQuiz}
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
