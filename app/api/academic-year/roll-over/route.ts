import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PASSING_GRADE = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { currentAcademicYearId, newAcademicYearId } = await req.json();

    if (!currentAcademicYearId || !newAcademicYearId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const currentYear = await prisma.academicYear.findUnique({
      where: { id: currentAcademicYearId },
    });

    const newYear = await prisma.academicYear.findUnique({
      where: { id: newAcademicYearId },
    });

    if (!currentYear || !newYear) {
      return new NextResponse("Academic year not found", { status: 404 });
    }

    const studentAcademicYears = await prisma.studentAcademicYear.findMany({
      where: { academicYearId: currentAcademicYearId },
      include: {
        student: true,
        level: true,
      },
    });

    const results = await Promise.all(
      studentAcademicYears.map(async (studentYear) => {
        try {
          const courseScores = await prisma.studentCourseScore.findMany({
            where: { studentId: studentYear.studentId },
          });

          let finalGrade = 0;
          if (courseScores.length > 0) {
            const totalScore = courseScores.reduce((sum, score) => sum + score.score, 0);
            finalGrade = totalScore / courseScores.length;
          }

          await prisma.studentAcademicYear.update({
            where: { id: studentYear.id },
            data: {
              status: finalGrade >= PASSING_GRADE ? 'COMPLETED' : 'FAILED',
              finalGrade,
            },
          });

          let nextLevelId = studentYear.levelId;
          if (finalGrade >= PASSING_GRADE) {
            const nextLevel = await prisma.level.findFirst({
              where: {
                position: {
                  gt: studentYear.level.position,
                },
              },
              orderBy: {
                position: 'asc',
              },
            });

            if (nextLevel) {
              nextLevelId = nextLevel.id;
            }
          }

          const newStudentYear = await prisma.studentAcademicYear.create({
            data: {
              studentId: studentYear.studentId,
              academicYearId: newAcademicYearId,
              levelId: nextLevelId,
              status: 'ACTIVE',
              isPaid: false,
            },
          });

          await prisma.user.update({
            where: { id: studentYear.studentId },
            data: { levelId: nextLevelId },
          });

          return {
            studentId: studentYear.studentId,
            previousLevel: studentYear.level.name,
            finalGrade,
            status: finalGrade >= PASSING_GRADE ? 'PASSED' : 'FAILED',
            newYearId: newStudentYear.id,
          };
        } catch (error) {
          console.error(`Error processing student ${studentYear.studentId}:`, error);
          return {
            studentId: studentYear.studentId,
            error: 'Failed to process student',
          };
        }
      })
    );

    await prisma.academicYear.update({
      where: { id: currentAcademicYearId },
      data: { isActive: false },
    });

    await prisma.academicYear.update({
      where: { id: newAcademicYearId },
      data: { isActive: true },
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} students`,
      results,
    });

  } catch (error) {
    console.error("[ACADEMIC_YEAR_ROLL_OVER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 