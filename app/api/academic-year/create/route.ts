import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, startDate, endDate } = await req.json();

    if (!name) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const yearRegex = /^\d{4}$/;
    let finalStartDate = startDate;
    let finalEndDate = endDate;

    if (yearRegex.test(name)) {
      finalStartDate = new Date(`${name}-01-01T00:00:00.000Z`);
      finalEndDate = new Date(`${name}-12-31T23:59:59.999Z`);
    } else if (!startDate || !endDate) {
      return new NextResponse("Missing required dates for non-standard year format", { status: 400 });
    }

    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true }
    });

    const academicYear = await prisma.academicYear.create({
      data: {
        name,
        startDate: new Date(finalStartDate),
        endDate: new Date(finalEndDate),
        isActive: activeYear ? false : true,
      }
    });

    return NextResponse.json(academicYear);
  } catch (error) {
    console.error("[ACADEMIC_YEAR_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 