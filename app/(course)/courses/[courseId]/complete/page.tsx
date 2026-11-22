import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProgress } from "@/actions/get-progress";
import { ensureCertificate } from "@/actions/certificate";
import { getCertificateEligibility } from "@/lib/certificate-eligibility";
import { hasCourseEnrollmentAccess } from "@/lib/chapter-access";
import { CompletionHero } from "./_components/completion-hero";
import { CertificateStudio } from "./_components/certificate-studio";
import { MaverickCta } from "./_components/maverick-cta";
import { GuateLibreFooter } from "./_components/guate-libre-footer";
import { CertificateLockedCard } from "./_components/certificate-locked-card";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function CourseCompletePage(props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;
  const [course, enrollment, progress, eligibility, hasEnrollment] = await Promise.all([
    prisma.course.findUnique({
      where: { id: params.courseId },
      select: { id: true, title: true },
    }),
    prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId: params.courseId } },
    }),
    getProgress(userId, params.courseId),
    getCertificateEligibility(userId, params.courseId),
    hasCourseEnrollmentAccess(userId, params.courseId),
  ]);
  if (!course) redirect("/courses");

  // Guard: only finishers. Accept a recorded completedAt OR live 100%.
  if (!hasEnrollment || (!enrollment?.completedAt && progress < 100)) {
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
