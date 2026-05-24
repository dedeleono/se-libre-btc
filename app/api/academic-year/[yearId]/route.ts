import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { yearId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { yearId } = params;
    const { name, startDate, endDate, isActive } = await req.json();

    if (!name || !startDate || !endDate) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (isActive) {
      await prisma.academicYear.updateMany({
        where: {
          isActive: true,
          id: {
            not: yearId
          }
        },
        data: {
          isActive: false
        }
      });
    }

    const academicYear = await prisma.academicYear.update({
      where: {
        id: yearId
      },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive
      }
    });

    return NextResponse.json(academicYear);
  } catch (error) {
    console.error("[ACADEMIC_YEAR_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 