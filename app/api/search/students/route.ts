import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json([]);
    }

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        OR: [
          {
            firstName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      take: 5,
    });

    const formattedStudents = students.map(student => ({
      id: student.id,
      name: student.firstName && student.lastName 
        ? `${student.firstName} ${student.lastName}`
        : null,
      email: student.email,
    }));

    return NextResponse.json(formattedStudents);
  } catch (error) {
    console.error("[STUDENT_SEARCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 