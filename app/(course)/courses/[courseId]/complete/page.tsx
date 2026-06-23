import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureCertificate } from "@/actions/certificate";
import { getCertificateEligibility, type CertificateEligibility } from "@/lib/certificate-eligibility";
import { CompletionHero } from "./_components/completion-hero";
import { CertificateStudio } from "./_components/certificate-studio";
import { MaverickCta } from "./_components/maverick-cta";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServerMessages } from "@/lib/i18n-server";
import { LockKeyhole, RotateCcw } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CourseCompletePage(props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: { id: true, title: true },
  });
  if (!course) redirect("/courses");

  const eligibility = await getCertificateEligibility(session.user.id, params.courseId);
  if (eligibility.reason === "COURSE_NOT_COMPLETE") {
    redirect(`/courses/${params.courseId}`);
  }

  if (!eligibility.eligible) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 pb-16">
        <CompletionHero courseTitle={course.title} />
        <CertificateLockedCard eligibility={eligibility} />
        <Separator className="my-2" />
        <MaverickCta />
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
    </div>
  );
}

function CertificateLockedCard({ eligibility }: { eligibility: CertificateEligibility }) {
  const t = getServerMessages().completion;
  const description =
    eligibility.reason === "NO_FINAL_QUIZ"
      ? t.certificateLockedNoFinalQuizDescription
      : t.certificateLockedScoreDescription(eligibility.bestFinalQuizScorePercent);

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
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
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
