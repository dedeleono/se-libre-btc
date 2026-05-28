import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const liveSessions = await prisma.liveSession.findMany({
    include: { cohort: true, course: true, learningPath: true },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json(liveSessions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

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
