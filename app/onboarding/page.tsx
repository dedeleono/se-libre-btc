import { auth } from "@/lib/auth";
import { redirect } from 'next/navigation';
import OnboardingForm from './_components/onboarding-form';
import Image from 'next/image';
import { Navbar } from "./_components/navbar";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { invitationId?: string };
}) {
  const session = await auth();

  if (!session) {
    redirect('/sign-in');
  }

  if (!session.user?.role) {
    redirect('/error?message=Invalid user role');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      isBanned: true,
      isDeleted: true,
      onboardingCompleted: true,
    },
  });

  if (!user || user.isBanned || user.isDeleted) {
    redirect('/error?message=User not allowed');
  }

  if (user.onboardingCompleted) {
    redirect(session.user.role === UserRole.ADMIN ? "/admin" : "/student");
  }

  let pendingInvitation = null;
  if (searchParams.invitationId) {
    const invitation = await prisma.pendingInvitation.findUnique({
      where: {
        id: searchParams.invitationId,
      },
      include: {
        payment: true,
        learningPath: true,
        course: true,
        cohort: true,
      },
    });

    if (!invitation) {
      redirect('/error?message=Invalid invitation');
    }

    pendingInvitation = {
      id: invitation.id,
      email: invitation.email,
      name: invitation.name,
      learningPath: invitation.learningPath && {
        id: invitation.learningPath.id,
        title: invitation.learningPath.title,
        position: invitation.learningPath.position,
        price: invitation.learningPath.price ? Number(invitation.learningPath.price) : null,
      },
      payment: invitation.payment && {
        id: invitation.payment.id,
        status: invitation.payment.status,
      },
    };
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-[80px] fixed inset-y-0 w-full z-50">
        <Navbar userId={session?.user?.id} userRole={session?.user?.role} />
      </div>
      <main className="grid flex-1 place-items-center p-4 min-h-screen">
        <div className="w-full min-h-screen max-w-3xl flex flex-col items-center justify-center">
          <OnboardingForm
            organizationId={session.user.id}
            userRole={session.user.role}
            pendingInvitation={pendingInvitation}
          />
        </div>
        <Image
          className="fixed bottom-0 right-0 -z-10 opacity-20 invert dark:invert-0"
          width={900}
          height={900}
          src="/imgs/thru/bg.svg"
          alt=""
        />
      </main>
    </div>
  );
}
