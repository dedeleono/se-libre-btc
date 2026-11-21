import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, props: { params: Promise<{ liveSessionId: string }> }) {
  const params = await props.params;
  const authz = await requireAdminApi();
  if (!authz.ok) return authz.response;

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

export async function DELETE(req: Request, props: { params: Promise<{ liveSessionId: string }> }) {
  const params = await props.params;
  const authz = await requireAdminApi();
  if (!authz.ok) return authz.response;

  await prisma.liveSession.delete({
    where: { id: params.liveSessionId },
  });

  return NextResponse.json({ success: true });
}
