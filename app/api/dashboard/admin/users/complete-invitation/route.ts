import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { invitationId } = body;

    if (!invitationId) {
      return new NextResponse("Invitation ID is required", { status: 400 });
    }

    const pendingInvitation = await prisma.pendingInvitation.findUnique({
      where: {
        id: invitationId,
      },
      include: {
        payment: true,
        level: true,
      },
    });

    if (!pendingInvitation) {
      return new NextResponse("Invitation not found", { status: 404 });
    }

    if (!pendingInvitation.payment || pendingInvitation.payment.status !== "COMPLETED") {
      return new NextResponse("Payment not completed", { status: 400 });
    }

    // Update user with level assignment
    if (pendingInvitation.level) {
      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          levelId: pendingInvitation.level.id,
        },
      });
    }

    // Delete the pending invitation
    await prisma.pendingInvitation.delete({
      where: {
        id: invitationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[COMPLETE_INVITATION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 