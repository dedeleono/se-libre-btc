import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProgress } from "@/actions/get-progress";
import { ensureCertificate } from "@/actions/certificate";
import { CompletionHero } from "./_components/completion-hero";
import { CertificateStudio } from "./_components/certificate-studio";
import { MaverickCta } from "./_components/maverick-cta";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function CourseCompletePage({ params }: { params: { courseId: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: { id: true, title: true },
  });
  if (!course) redirect("/courses");

  // Guard: only finishers. Accept a recorded completedAt OR live 100%.
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: params.courseId } },
  });
  const progress = await getProgress(session.user.id, params.courseId);
  if (!enrollment?.completedAt && progress < 100) {
    redirect(`/courses/${params.courseId}`);
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
