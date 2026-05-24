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

interface SearchParams {
  invitationId?: string;
  userId?: string;
  levelId?: string;
  email?: string;
  name?: string;
}

export default async function InscriptionSection({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let pendingInvitation = null;

  // Try to fetch the invitation from either invitationId or userId + levelId
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
  } else if (searchParams.userId && searchParams.levelId) {
    // If we have userId and levelId but no invitationId, create a temporary invitation object
    pendingInvitation = {
      id: searchParams.userId,
      email: searchParams.email || "",
      name: searchParams.name || "",
      level: await prisma.level.findUnique({
        where: {
          id: searchParams.levelId,
        },
      }),
      payment: null,
    };
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex w-full flex-row items-center mb-6 justify-between">
        <h1 className="text-3xl font-black  font-['Open_Sans'] text-primary">
          INSCRIPCIÓN
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