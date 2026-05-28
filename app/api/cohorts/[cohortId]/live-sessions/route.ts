import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { cohortId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  if (!body.title || !body.startsAt) {
    return new NextResponse("Title and start date are required", { status: 400 });
  }

  const cohort = await prisma.cohort.findUnique({
    where: { id: params.cohortId },
    select: { courseId: true, learningPathId: true },
  });

  if (!cohort) {
    return new NextResponse("Cohort not found", { status: 404 });
  }

  const liveSession = await prisma.liveSession.create({
    data: {
      title: body.title,
      description: body.description,
      status: body.status || "SCHEDULED",
      startsAt: new Date(body.startsAt),
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      meetingUrl: body.meetingUrl,
      cohortId: params.cohortId,
      courseId: cohort.courseId,
      learningPathId: cohort.learningPathId,
    },
  });

  return NextResponse.json(liveSession);
}
