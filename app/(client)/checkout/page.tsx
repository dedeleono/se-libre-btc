import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CheckoutStepper from "@/components/checkout-stepper";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

interface SearchParams {
  invitationId?: string;
  userId?: string;
  learningPathId?: string;
  email?: string;
  name?: string;
}

export default async function InscriptionSection({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let pendingInvitation = null;

  // Try to fetch the invitation from either invitationId or userId + learningPathId.
  if (searchParams.invitationId) {
    const invitation = await prisma.pendingInvitation.findUnique({
      where: {
        id: searchParams.invitationId,
      },
      include: {
        payment: true,
        learningPath: true,
      },
    });

    pendingInvitation = invitation && {
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
  } else if (searchParams.userId && searchParams.learningPathId) {
    const learningPath = await prisma.learningPath.findUnique({
      where: { id: searchParams.learningPathId },
      select: {
        id: true,
        title: true,
        position: true,
        price: true,
      },
    });

    pendingInvitation = {
      id: searchParams.userId,
      email: searchParams.email || "",
      name: searchParams.name || "",
      learningPath: learningPath && {
        ...learningPath,
        price: learningPath.price ? Number(learningPath.price) : null,
      },
      payment: null,
    };
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex w-full flex-row items-center mb-6 justify-between">
        <h1 className="text-3xl font-black  font-['Open_Sans'] text-primary">
ENROLLMENT
        </h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className=" bg-primary text-white hover:bg-primary/80">
              Ver Tutorial
            </Button>
          </DialogTrigger>

          {/* Modal with iFrame */}
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Detalles de Inscripción
              </DialogTitle>
            </DialogHeader>

            {/* Embedded iFrame */}
            <div className="relative w-full h-96">
              <iframe width="100%" height="400px" src="https://dubble.so/guides/como-inscribirte-75vmd82feuerl3r4sgma?embed=1"></iframe>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <CheckoutStepper pendingInvitation={pendingInvitation} />
    </div>
  );
}

export const revalidate = 0;
