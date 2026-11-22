import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const authz = await requireAdminApi();
  if (!authz.ok) return authz.response;

  const body = await req.json();
  if (!body.title || !body.startsAt) {
    return new NextResponse("Title and startsAt are required", { status: 400 });
  }

  const liveSession = await prisma.liveSession.create({
    data: {
      title: body.title,
      description: body.description,
      startsAt: new Date(body.startsAt),
      endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      meetingUrl: body.meetingUrl,
      recordingUrl: body.recordingUrl,
      cohortId: body.cohortId,
      courseId: body.courseId,
      learningPathId: body.learningPathId,
    },
  });

  return NextResponse.json(liveSession);
}
