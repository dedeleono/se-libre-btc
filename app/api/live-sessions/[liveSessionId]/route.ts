import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { liveSessionId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const liveSession = await prisma.liveSession.update({
    where: { id: params.liveSessionId },
    data: {
      title: body.title,
      description: body.description,
      status: body.status,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      meetingUrl: body.meetingUrl,
      recordingUrl: body.recordingUrl,
    },
  });

  return NextResponse.json(liveSession);
}

export async function DELETE(
  req: Request,
  { params }: { params: { liveSessionId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await prisma.liveSession.delete({
    where: { id: params.liveSessionId },
  });

  return NextResponse.json({ success: true });
}
