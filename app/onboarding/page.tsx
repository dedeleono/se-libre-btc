import { auth } from "@/lib/auth";
import { redirect } from 'next/navigation';
import OnboardingForm from './_components/onboarding-form';
import Header from "@/components/layout/header";
import Image from 'next/image';
import { motion } from 'framer-motion';
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

  // For students, check if they have completed checkout
  if (session.user.role === UserRole.STUDENT) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        academicYears: true
      },
    });

    if (!user) {
      redirect('/error?message=User not found');
    }

    // Check if the student has at least one academic year with isPaid = true
    const hasValidEnrollment = user.academicYears.some(year => year.isPaid === true);
    
    // If user has no valid academic year enrollment, redirect to checkout
    if (!hasValidEnrollment) {
      redirect('/checkout');
    }
  }

  let pendingInvitation = null;
  if (searchParams.invitationId) {
    pendingInvitation = await prisma.pendingInvitation.findUnique({
      where: {
        id: searchParams.invitationId,
      },
      include: {
        payment: true,
        level: true,
      },
    });

    if (!pendingInvitation) {
      redirect('/error?message=Invalid invitation');
    }

    // If payment is not completed, redirect to checkout
    if (!pendingInvitation.payment || pendingInvitation.payment.status !== 'COMPLETED') {
      redirect(`/checkout?invitationId=${searchParams.invitationId}`);
    }
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
